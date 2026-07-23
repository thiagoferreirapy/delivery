"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationKind = "order" | "message";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
  data?: Record<string, unknown>;
}

interface State {
  items: AppNotification[];
  add: (n: { title: string; body: string; kind?: NotificationKind; data?: Record<string, unknown> }) => void;
  markAllRead: () => void;
  markRead: (ids: string[]) => void;
  clear: () => void;
  clearKind: (kind: NotificationKind) => void;
  unread: () => number;
}

export const useNotificationsStore = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      add: (n) =>
        set((s) => ({
          items: [
            {
              id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
              kind: n.kind ?? "order",
              title: n.title,
              body: n.body,
              at: Date.now(),
              read: false,
              data: n.data,
            },
            ...s.items,
          ].slice(0, 50),
        })),
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
      // Marca como lidas apenas as notificações informadas (ex.: ao abrir um grupo)
      markRead: (ids) =>
        set((s) => {
          const set2 = new Set(ids);
          return { items: s.items.map((i) => (set2.has(i.id) ? { ...i, read: true } : i)) };
        }),
      clear: () => set({ items: [] }),
      // Limpa só as de um grupo. "order" também remove as antigas sem kind (que a
      // página agrupa em "Pedidos"); "message" remove só as de conversa.
      clearKind: (kind) =>
        set((s) => ({
          items: s.items.filter((i) => (kind === "message" ? i.kind !== "message" : i.kind === "message")),
        })),
      unread: () => get().items.filter((i) => !i.read).length,
    }),
    { name: "cabana-cliente-notifs" }
  )
);
