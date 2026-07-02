"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  data?: Record<string, unknown>;
}

interface State {
  items: AppNotification[];
  add: (n: { title: string; body: string; data?: Record<string, unknown> }) => void;
  markAllRead: () => void;
  clear: () => void;
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
      clear: () => set({ items: [] }),
      unread: () => get().items.filter((i) => !i.read).length,
    }),
    { name: "cabana-cliente-notifs" }
  )
);
