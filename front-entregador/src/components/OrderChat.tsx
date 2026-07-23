"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderMessageDTO, type OrderMessageEvent, type OrderMessagesResponse } from "@cabana/shared";
import { Loader2 } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { setActiveChat } from "@/lib/active-chat";
import { useOrderMessages, useSendMessage, useMarkMessagesRead } from "@/lib/queries";
import { IconChevronLeft } from "@/components/icons";

// Respostas rápidas (tocar = envia na hora)
const QUICK_REPLIES = [
  "Estou a caminho! 🛵",
  "Cheguei! 📍",
  "Estou na portaria/portão.",
  "Pode descer, por favor?",
  "Tive um imprevisto, já já chego.",
];

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function appendToCache(qc: ReturnType<typeof useQueryClient>, orderId: string, m: OrderMessageDTO) {
  qc.setQueryData<OrderMessagesResponse>(["order-messages", orderId, "COURIER"], (old) =>
    old && !old.messages.some((x) => x.id === m.id) ? { ...old, messages: [...old.messages, m] } : old
  );
}

// Bottom-sheet da conversa entregador <-> cliente.
export function OrderChat({ orderId, customerName, onClose }: { orderId: string; customerName: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useOrderMessages(orderId);
  const send = useSendMessage(orderId);
  const markRead = useMarkMessagesRead(orderId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const msgs = data?.messages ?? [];
  const chatOpen = data?.chatOpen ?? true;

  useEffect(() => {
    setActiveChat(orderId);
    return () => setActiveChat(null);
  }, [orderId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("order:subscribe", orderId);
    const onNew = (e: OrderMessageEvent) => {
      if (e.orderId !== orderId || e.message.channel !== "COURIER") return;
      appendToCache(qc, orderId, e.message);
      if (e.message.senderType === "CUSTOMER") markRead.mutate();
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    return () => {
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

  function sendBody(body: string) {
    const t = body.trim();
    if (!t || send.isPending) return;
    send.mutate(t, { onSuccess: (m) => appendToCache(qc, orderId, m) });
  }

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
    <div className="fixed inset-0 z-50 flex flex-col bg-cream">
      <header className="flex items-center gap-2 border-b border-black/5 px-3 py-3 safe-top">
        <button onClick={onClose} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5">
          <IconChevronLeft />
        </button>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-ink">Falar com o cliente</h3>
          <p className="truncate text-xs text-muted">{customerName}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {isLoading && msgs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Carregando…</p>
        ) : msgs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Nenhuma mensagem ainda. Avise o cliente sobre a entrega.</p>
        ) : (
          msgs.map((m) => <Bubble key={m.id} m={m} mine={m.senderType === "COURIER"} />)
        )}
      </div>

      <footer className="border-t border-black/5 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {chatOpen ? (
          <>
            {/* Respostas rápidas */}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendBody(q)}
                  disabled={send.isPending}
                  className="shrink-0 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand transition active:scale-95 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
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
          </>
        ) : (
          <p className="rounded-xl bg-black/[0.03] px-3 py-2 text-center text-xs text-muted">
            A conversa fica disponível enquanto o pedido está a caminho.
          </p>
        )}
      </footer>
    </div>
  );
}

function Bubble({ m, mine }: { m: OrderMessageDTO; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-white text-ink shadow-card"}`}>
        {!mine && <p className="mb-0.5 text-[11px] font-semibold opacity-70">{m.senderName}</p>}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>{hhmm(m.createdAt)}</p>
      </div>
    </div>
  );
}
