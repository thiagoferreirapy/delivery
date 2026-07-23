"use client";
// Guarda qual conversa (pedido) o entregador está vendo agora, para NÃO tocar
// toast de mensagens que ele já está lendo no chat aberto. O entregador só tem
// um canal (COURIER), então basta o orderId.
let activeOrderId: string | null = null;

export function setActiveChat(orderId: string | null) {
  activeOrderId = orderId;
}

export function isViewingChat(orderId: string): boolean {
  return activeOrderId === orderId;
}
