"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDTO } from "@cabana/shared";

export interface CartExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
export interface CartRemoved {
  id: string;
  name: string;
}

export interface CartItem {
  id: string; // assinatura da linha (produto + customização)
  productId: string;
  name: string;
  imageUrl: string | null;
  basePrice: number; // finalPrice do produto
  unitPrice: number; // basePrice + extras (por unidade)
  quantity: number;
  notes?: string;
  extras: CartExtra[];
  removed: CartRemoved[];
}

interface AddOptions {
  notes?: string;
  extras?: CartExtra[];
  removed?: CartRemoved[];
}

interface CartState {
  items: CartItem[];
  add: (product: ProductDTO, quantity: number, opts?: AddOptions) => void;
  setQty: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

// Assinatura única da linha: mesmo produto com customização diferente = linhas separadas.
function signature(productId: string, extras: CartExtra[], removed: CartRemoved[], notes?: string): string {
  const e = [...extras].sort((a, b) => a.id.localeCompare(b.id)).map((x) => `${x.id}:${x.quantity}`).join(",");
  const r = [...removed].sort((a, b) => a.id.localeCompare(b.id)).map((x) => x.id).join(",");
  return `${productId}|${e}|${r}|${notes ?? ""}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity, opts = {}) =>
        set((s) => {
          const extras = opts.extras ?? [];
          const removed = opts.removed ?? [];
          const notes = opts.notes;
          const extrasSum = extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
          const unitPrice = Math.round((product.finalPrice + extrasSum) * 100) / 100;
          const id = signature(product.id, extras, removed, notes);

          const existing = s.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: s.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + quantity } : i)),
            };
          }
          return {
            items: [
              ...s.items,
              {
                id,
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                basePrice: product.finalPrice,
                unitPrice,
                quantity,
                notes,
                extras,
                removed,
              },
            ],
          };
        }),
      setQty: (lineId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.id !== lineId)
              : s.items.map((i) => (i.id === lineId ? { ...i, quantity } : i)),
        })),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.id !== lineId) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    }),
    { name: "cabana-cliente-cart-v2" }
  )
);
