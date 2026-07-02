export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ?? API_URL;

// Apenas para exibição — o valor real da taxa é calculado no servidor ao criar o pedido.
export const DELIVERY_FEE_DISPLAY = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? 7.9);
