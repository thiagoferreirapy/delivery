"use client";
// Guarda qual conversa (pedido + canal) está aberta na tela agora, para NÃO gerar
// notificação/toast de mensagens que o usuário já está vendo no chat aberto.
// Chave = `${orderId}#${channel}` (STORE = loja, COURIER = entregador).
let activeKey: string | null = null;

const key = (orderId: string, channel: string) => `${orderId}#${channel}`;

export function setActiveChat(orderId: string | null, channel: string = "STORE") {
  activeKey = orderId ? key(orderId, channel) : null;
}

export function isViewingChat(orderId: string, channel: string = "STORE"): boolean {
  return activeKey === key(orderId, channel);
}
