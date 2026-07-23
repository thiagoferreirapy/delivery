"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type MessageChannel, type OrderMessageDTO, type OrderMessageEvent, type OrderMessagesResponse } from "@cabana/shared";
import { Loader2 } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { setActiveChat } from "@/lib/active-chat";
import { useOrderMessages, useSendMessage, useMarkMessagesRead } from "@/lib/queries";

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function appendToCache(qc: ReturnType<typeof useQueryClient>, orderId: string, channel: MessageChannel, m: OrderMessageDTO) {
  qc.setQueryData<OrderMessagesResponse>(["order-messages", orderId, channel], (old) =>
    old && !old.messages.some((x) => x.id === m.id) ? { ...old, messages: [...old.messages, m] } : old
  );
}

// Bottom-sheet da conversa. channel STORE = loja; COURIER = entregador.
export function OrderChat({
  orderId,
  channel = "STORE",
  onClose,
}: {
  orderId: string;
  channel?: MessageChannel;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useOrderMessages(orderId, channel);
  const send = useSendMessage(orderId, channel);
  const markRead = useMarkMessagesRead(orderId, channel);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const msgs = data?.messages ?? [];
  const chatOpen = data?.chatOpen ?? true;
  const isCourier = channel === "COURIER";

  useEffect(() => {
    setActiveChat(orderId, channel);
    return () => setActiveChat(null);
  }, [orderId, channel]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("order:subscribe", orderId);
    const onNew = (e: OrderMessageEvent) => {
      if (e.orderId === orderId && e.message.channel === channel) appendToCache(qc, orderId, channel, e.message);
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    };
  }, [orderId, channel, qc]);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, channel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  function submit() {
    const body = text.trim();
    if (!body || send.isPending) return;
    setText("");
    send.mutate(body, {
      onSuccess: (m) => appendToCache(qc, orderId, channel, m),
      onError: () => setText(body),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="flex h-[80dvh] w-full max-w-app flex-col rounded-t-3xl bg-cream" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-black/15" />
        <header className="px-4 py-3 text-center">
          <h3 className="font-display text-lg font-bold text-ink">{isCourier ? "Falar com o entregador" : "Falar com a loja"}</h3>
          <p className="text-xs text-muted">Sobre o seu pedido</p>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 pb-2">
          {isLoading && msgs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Carregando…</p>
          ) : msgs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {isCourier ? "Nenhuma mensagem ainda. Fale com o entregador sobre a entrega." : "Nenhuma mensagem ainda. Escreva para tirar uma dúvida sobre o pedido."}
            </p>
          ) : (
            msgs.map((m) => <Bubble key={m.id} m={m} mine={m.senderType === "CUSTOMER"} />)
          )}
        </div>

        <footer className="border-t border-black/5 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {chatOpen ? (
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Escreva uma mensagem…"
                rows={1}
                className="input max-h-28 flex-1 resize-none"
              />
              <button onClick={submit} disabled={send.isPending || !text.trim()} className="btn-primary shrink-0">
                {send.isPending ? <Loader2 className="animate-spin" width={18} height={18} /> : "Enviar"}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-black/[0.03] px-3 py-2 text-center text-xs text-muted">
              {isCourier ? "A conversa com o entregador fica disponível enquanto o pedido está a caminho." : "Conversa encerrada. Este pedido já foi finalizado."}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

function Bubble({ m, mine }: { m: OrderMessageDTO; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "bg-brand text-white" : "bg-white text-ink shadow-card"
        }`}
      >
        {!mine && <p className="mb-0.5 text-[11px] font-semibold opacity-70">{m.senderName}</p>}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>{hhmm(m.createdAt)}</p>
      </div>
    </div>
  );
}
