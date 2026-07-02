"use client";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { useAuthStore } from "./auth-store";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const token = useAuthStore.getState().token;
  socket = io(SOCKET_URL, {
    auth: token ? { token } : {},
    transports: ["websocket"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
