"use client";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/auth-store";
import { useNotificationsStore } from "@/lib/notifications-store";

// Escuta as push notifications (via socket) em qualquer tela e acumula no store.
export function NotificationsListener() {
  const token = useAuthStore((s) => s.token);
  const add = useNotificationsStore((s) => s.add);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const onNotif = (payload: { title?: string; body?: string; data?: Record<string, unknown> }) => {
      if (payload?.title) add({ title: payload.title, body: payload.body ?? "", data: payload.data });
    };
    socket.on("push:notification", onNotif);
    return () => {
      socket.off("push:notification", onNotif);
    };
  }, [token, add]);

  return null;
}
