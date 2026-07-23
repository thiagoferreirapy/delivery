"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderMessageEvent, type OrderStatusEvent } from "@cabana/shared";
import { getSocket } from "@/lib/socket";
import { isViewingChat } from "@/lib/active-chat";
import { useAuthStore } from "@/lib/auth-store";

// Notificações em tempo real do entregador (em qualquer tela): nova entrega
// atribuída pela expedição e mensagens do cliente.
export function CourierMessagesListener() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();

    // Expedição atribuiu um pedido a este entregador (COURIER_ASSIGNED)
    const onAssigned = (e: OrderStatusEvent) => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success(`Nova entrega${e?.code ? ` - ${e.code}` : ""}`, {
        description: "Um pedido foi encaminhado para você.",
      });
    };

    // Mensagem do cliente sobre uma entrega
    const onNew = (e: OrderMessageEvent) => {
      if (e.message.channel !== "COURIER") return; // só o canal do entregador
      qc.invalidateQueries({ queryKey: ["order-messages", e.orderId, "COURIER"] });
      if (e.message.senderType !== "CUSTOMER") return; // ignora o eco das próprias
      if (isViewingChat(e.orderId)) return; // já está vendo essa conversa
      toast.message(`Mensagem do cliente${e.code ? ` - ${e.code}` : ""}`, {
        description: e.message.body,
      });
    };

    socket.on(SOCKET_EVENTS.COURIER_ASSIGNED, onAssigned);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.COURIER_ASSIGNED, onAssigned);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    };
  }, [token, qc]);

  return null;
}
