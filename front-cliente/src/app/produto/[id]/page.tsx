"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useProduct } from "@/lib/queries";
import { useCartStore } from "@/lib/cart-store";
import { brl } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { ProductDetailSkeleton } from "@/components/Skeleton";
import { IconMinus, IconPlus } from "@/components/icons";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const add = useCartStore((s) => s.add);
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
      <PageHeader title="" back="/" />

      <div className="relative -mt-14 aspect-square w-full bg-black/5">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt={product.name} fill sizes="480px" className="object-cover" priority />
        )}
        {product.promoActive && product.promoPercent && (
          <span className="absolute right-3 top-16 rounded-full bg-brand px-3 py-1 text-sm font-bold text-cream">
            {product.promoPercent}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{product.name}</h1>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-brand">{brl(product.finalPrice)}</span>
            {product.promoActive && product.promoPercent && (
              <span className="text-sm text-muted line-through">{brl(product.price)}</span>
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
