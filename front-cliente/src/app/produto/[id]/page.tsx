"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useProduct } from "@/lib/queries";
import { useCartStore } from "@/lib/cart-store";
import { brl } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { ProductDetailSkeleton } from "@/components/Skeleton";
import { IconMinus, IconPlus, IconChevronLeft, IconCart } from "@/components/icons";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const add = useCartStore((s) => s.add);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <EmptyState emoji="😕" title="Produto não encontrado" />;

  const total = product.finalPrice * qty;

  function addToCart() {
    if (!product) return;
    add(product, qty, notes || undefined);
    router.push("/carrinho");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-28">
      {/* Hero da foto com botões flutuantes (estilo iFood) */}
      <div className="relative aspect-square w-full bg-black/[0.03]">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt={product.name} fill sizes="480px" className="object-cover" priority />
        )}
        <div className="safe-top pointer-events-none absolute inset-x-0 top-[10px] z-10 flex items-start justify-between p-3">
          <Link
            href="/"
            aria-label="Voltar"
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur transition active:scale-95"
          >
            <IconChevronLeft width={20} height={20} />
          </Link>
          <Link
            href="/carrinho"
            aria-label="Carrinho"
            className="pointer-events-auto relative grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur transition active:scale-95"
          >
            <IconCart width={20} height={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        {product.promoActive && product.promoPercent && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
            -{product.promoPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{product.name}</h1>
          <div className="mt-1 flex items-baseline gap-2">
            {product.promoActive && product.promoPercent && (
              <span className="text-sm text-muted line-through">{brl(product.price)}</span>
            )}
            <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{brl(product.finalPrice)}</span>
            {product.promoActive && product.promoPercent && (
              <span className="text-sm font-semibold text-success">{product.promoPercent}% OFF</span>
            )}
          </div>
        </div>

        {product.description && <p className="text-sm text-ink/80">{product.description}</p>}

        {product.ingredients && (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-ink">Ingredientes</h2>
            <p className="text-sm text-muted">{product.ingredients}</p>
          </section>
        )}
        {product.prepNotes && (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-ink">Modo de preparo</h2>
            <p className="text-sm text-muted">{product.prepNotes}</p>
          </section>
        )}

        <section>
          <h2 className="mb-1 text-sm font-semibold text-ink">Observações</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: sem cebola, ponto da carne…"
            className="input min-h-[64px] resize-none"
          />
        </section>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-ink">Quantidade</span>
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-2 py-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label="Diminuir">
              <IconMinus width={18} height={18} />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label="Aumentar">
              <IconPlus width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Barra fixa de ação */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 p-4 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-app items-center gap-3">
          <button onClick={addToCart} className="btn-primary w-full">
            Adicionar • {brl(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
