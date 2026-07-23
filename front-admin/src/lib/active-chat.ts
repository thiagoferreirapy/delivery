"use client";
// Guarda qual conversa (pedido) está aberta na tela agora, para não gerar
// toast/aviso de mensagens que o atendente já está vendo no chat aberto.
let activeChatOrderId: string | null = null;

export function setActiveChat(orderId: string | null) {
  activeChatOrderId = orderId;
}

export function isViewingChat(orderId: string): boolean {
  return activeChatOrderId === orderId;
}
