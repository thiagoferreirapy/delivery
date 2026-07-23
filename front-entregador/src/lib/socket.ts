"use client";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { useAuthStore } from "./auth-store";

let socket: Socket | null = null;
let authedWith: string | null = null;

export function getSocket(): Socket {
  const token = useAuthStore.getState().token ?? null;

  if (!socket) {
    socket = io(SOCKET_URL || undefined, {
      auth: token ? { token } : {},
      // WebSocket primeiro (localhost/LAN); cai p/ polling se não subir (ngrok).
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    authedWith = token;
    return socket;
  }

  // Re-autentica se o token mudou (ex.: conectou antes do login hidratar).
  if (token !== authedWith) {
    authedWith = token;
    (socket.auth as Record<string, unknown>) = token ? { token } : {};
    socket.disconnect().connect();
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  authedWith = null;
}
