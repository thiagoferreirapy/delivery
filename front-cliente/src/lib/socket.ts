"use client";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { useAuthStore } from "./auth-store";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const token = useAuthStore.getState().token;
  // SOCKET_URL vazio => mesma origem (proxied). Polling primeiro p/ atravessar
  // o proxy/túnel de forma confiável, com upgrade p/ websocket quando possível.
  socket = io(SOCKET_URL || undefined, {
    auth: token ? { token } : {},
    transports: ["polling", "websocket"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
