"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { brl } from "@/lib/format";
import { DELIVERY_FEE_DISPLAY } from "@/lib/config";
import { TabShell } from "@/components/TabShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { IconMinus, IconPlus } from "@/components/icons";
import { useAuthStore } from "@/lib/auth-store";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const user = useAuthStore((s) => s.user);

  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const total = subtotal + (items.length ? DELIVERY_FEE_DISPLAY : 0);

  if (items.length === 0) {
    return (
      <TabShell>
        <PageHeader title="Meu pedido" />
        <EmptyState emoji="🛒" title="Seu carrinho está vazio" subtitle="Adicione itens do cardápio." />
        <div className="px-4">
          <Link href="/" className="btn-primary w-full">Ver cardápio</Link>
        </div>
      </TabShell>
    );
  }

  return (
    <TabShell>
      <PageHeader title="Meu pedido" />
      <div className="flex flex-col gap-3 p-4 pb-40">
        {items.map((item) => (
          <div key={item.productId} className="card flex gap-3 p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
              {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-sm font-medium leading-snug text-ink">{item.name}</p>
              {item.notes && <p className="text-xs text-muted">Obs: {item.notes}</p>}
              <div className="mt-auto flex items-center justify-between">
                <span className="font-semibold text-brand">{brl(item.unitPrice * item.quantity)}</span>
                <div className="flex items-center gap-2 rounded-full border border-black/10 px-1.5 py-0.5">
                  <button onClick={() => setQty(item.productId, item.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5" aria-label="Diminuir">
                    <IconMinus width={16} height={16} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => setQty(item.productId, item.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5" aria-label="Aumentar">
                    <IconPlus width={16} height={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button onClick={() => useCartStore.getState().clear()} className="self-start text-sm text-muted underline">
          Limpar carrinho
        </button>
      </div>

      {/* Resumo + ação */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-black/5 bg-white/95 p-4 backdrop-blur md:bottom-0 safe-bottom">
        <div className="mx-auto max-w-app">
          <dl className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd>{brl(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Taxa de entrega</dt>
              <dd>{brl(DELIVERY_FEE_DISPLAY)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-ink">
              <dt>Total</dt>
              <dd>{brl(total)}</dd>
            </div>
          </dl>
          <button
            onClick={() => router.push(user ? "/checkout" : "/login")}
            className="btn-primary w-full"
          >
            {user ? "Fazer pedido" : "Entrar para finalizar"}
          </button>
        </div>
      </div>
    </TabShell>
  );
}
