"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderMessageEvent } from "@cabana/shared";
import { getSocket } from "@/lib/socket";
import { isViewingChat } from "@/lib/active-chat";
import { useAuthStore } from "@/lib/auth-store";

// Avisa o painel (toast) quando um cliente manda mensagem sobre um pedido,
// mesmo que a conversa não esteja aberta. Escuta a sala "support" (o backend
// coloca ADMIN/ATTENDANT/DISPATCH nela ao conectar).
export function AdminMessagesListener() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const onNew = (e: OrderMessageEvent) => {
      // atualiza o badge de não lidas mesmo sem a conversa aberta
      qc.invalidateQueries({ queryKey: ["order-messages", e.orderId] });
      if (e.message.senderType !== "CUSTOMER") return; // só toca toast p/ mensagens do cliente
      if (isViewingChat(e.orderId)) return; // já está com essa conversa aberta -> não toca toast
      toast.message(`Nova mensagem - pedido ${e.code ?? ""}`.trim(), {
        description: `${e.message.senderName}: ${e.message.body}`,
      });
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    };
  }, [token, qc]);

  return null;
}
