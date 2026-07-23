"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderMessageDTO, type OrderMessageEvent, type OrderMessagesResponse } from "@cabana/shared";
import { Loader2 } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { setActiveChat } from "@/lib/active-chat";
import { useOrderMessages, useSendMessage, useMarkMessagesRead } from "@/lib/queries";
import { Icon } from "@/components/icons";

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function appendToCache(qc: ReturnType<typeof useQueryClient>, orderId: string, m: OrderMessageDTO) {
  qc.setQueryData<OrderMessagesResponse>(["order-messages", orderId], (old) =>
    old && !old.messages.some((x) => x.id === m.id) ? { ...old, messages: [...old.messages, m] } : old
  );
}

// Drawer lateral (desktop) / tela cheia (mobile) com a conversa do pedido.
export function OrderChat({
  orderId,
  customerName,
  onClose,
}: {
  orderId: string;
  customerName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useOrderMessages(orderId);
  const send = useSendMessage(orderId);
  const markRead = useMarkMessagesRead(orderId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const msgs = data?.messages ?? [];
  const chatOpen = data?.chatOpen ?? true;

  // Enquanto o drawer está aberto, esta é a conversa "ativa": mensagens dela não
  // viram toast (o atendente já está vendo).
  useEffect(() => {
    setActiveChat(orderId);
    return () => setActiveChat(null);
  }, [orderId]);

  // WebSocket entrega as mensagens ao vivo.
  useEffect(() => {
    const socket = getSocket();
    socket.emit("order:subscribe", orderId);
    const onNew = (e: OrderMessageEvent) => {
      if (e.orderId !== orderId) return;
      appendToCache(qc, orderId, e.message);
      // chegou mensagem do cliente com o chat aberto -> já está vista, marca lida
      if (e.message.senderType === "CUSTOMER") markRead.mutate();
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    return () => {
      socket.emit("order:unsubscribe", orderId);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, qc]);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  function submit() {
    const body = text.trim();
    if (!body || send.isPending) return;
    setText("");
    send.mutate(body, {
      onSuccess: (m) => appendToCache(qc, orderId, m),
      onError: () => setText(body),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col bg-cream shadow-soft" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-black/5 p-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-ink">Conversa com o cliente</h3>
            <p className="truncate text-xs text-muted">{customerName}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-black/5">
            <Icon.x />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {isLoading && msgs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Carregando…</p>
          ) : msgs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Nenhuma mensagem ainda. Envie a primeira para avisar o cliente sobre o pedido.
            </p>
          ) : (
            msgs.map((m) => <Bubble key={m.id} m={m} mine={m.senderType === "EMPLOYEE"} />)
          )}
        </div>

        <footer className="border-t border-black/5 p-3">
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
              Conversa encerrada. Este pedido já foi finalizado.
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
