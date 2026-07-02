"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDTO } from "@cabana/shared";

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number; // finalPrice no momento
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  add: (product: ProductDTO, quantity: number, notes?: string) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity, notes) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity, notes: notes ?? i.notes }
                  : i
              ),
            };
          }
          return {
            items: [
              ...s.items,
              {
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                unitPrice: product.finalPrice,
                quantity,
                notes,
              },
            ],
          };
        }),
      setQty: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    }),
    { name: "cabana-cliente-cart" }
  )
);
