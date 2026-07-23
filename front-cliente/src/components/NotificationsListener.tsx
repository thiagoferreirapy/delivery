"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { SOCKET_EVENTS, type OrderMessageEvent } from "@cabana/shared";
import { getSocket } from "@/lib/socket";
import { isViewingChat } from "@/lib/active-chat";
import { useAuthStore } from "@/lib/auth-store";
import { useNotificationsStore } from "@/lib/notifications-store";

// Escuta as push notifications (via socket) em qualquer tela e acumula no store.
export function NotificationsListener() {
  const token = useAuthStore((s) => s.token);
  const add = useNotificationsStore((s) => s.add);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    // push:notification = mudanças de status do pedido (a partir do backend)
    const onNotif = (payload: { title?: string; body?: string; data?: Record<string, unknown> }) => {
      if (payload?.title) add({ title: payload.title, body: payload.body ?? "", kind: "order", data: payload.data });
    };
    // Mensagens recebidas (da loja ou do entregador) viram notificação/badge + toast.
    const onMessage = (e: OrderMessageEvent) => {
      const m = e.message;
      if (m.senderType === "CUSTOMER") return; // ignora o eco das próprias mensagens
      if (isViewingChat(e.orderId, m.channel)) return; // já está vendo essa conversa -> não notifica
      const fromCourier = m.senderType === "COURIER";
      const title = `${fromCourier ? "Mensagem do entregador" : "Mensagem da loja"}${e.code ? ` - pedido ${e.code}` : ""}`;
      add({ title, body: m.body, kind: "message", data: { orderId: e.orderId } });
      toast.message(title, { description: m.body });
    };
    socket.on("push:notification", onNotif);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessage);
    return () => {
      socket.off("push:notification", onNotif);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessage);
    };
  }, [token, add]);

  return null;
}
