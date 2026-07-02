"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
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
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  const [removedSet, setRemovedSet] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Ao rolar, a imagem sobe e surge o header branco (close + nome).
  useEffect(() => {
    const onScroll = () => {
      const h = imageRef.current?.offsetHeight ?? 300;
      setCollapsed(window.scrollY > h - 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [product?.id]);

  const totalExtraQty = useMemo(
    () => Object.values(extraQty).reduce((a, b) => a + b, 0),
    [extraQty]
  );

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <EmptyState emoji="😕" title="Produto não encontrado" />;

  const p = product;
  const extrasFull = p.maxExtras != null && totalExtraQty >= p.maxExtras;

  function incExtra(exId: string) {
    if (extrasFull) return;
    setExtraQty((s) => ({ ...s, [exId]: (s[exId] ?? 0) + 1 }));
  }
  function decExtra(exId: string) {
    setExtraQty((s) => ({ ...s, [exId]: Math.max(0, (s[exId] ?? 0) - 1) }));
  }
  function toggleRemoved(rId: string) {
    setRemovedSet((prev) => {
      const next = new Set(prev);
      if (next.has(rId)) next.delete(rId);
      else {
        if (p.maxRemovable != null && next.size >= p.maxRemovable) return prev;
        next.add(rId);
      }
      return next;
    });
  }

  const selectedExtras = p.extras
    .filter((e) => (extraQty[e.id] ?? 0) > 0)
    .map((e) => ({ id: e.id, name: e.name, price: e.price, quantity: extraQty[e.id] }));
  const selectedRemoved = p.removables
    .filter((r) => removedSet.has(r.id))
    .map((r) => ({ id: r.id, name: r.name }));
  const extrasSum = selectedExtras.reduce((s, e) => s + e.price * e.quantity, 0);
  const unit = p.finalPrice + extrasSum;
  const total = unit * qty;

  function addToCart() {
    add(p, qty, { notes: notes || undefined, extras: selectedExtras, removed: selectedRemoved });
    router.push("/carrinho");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-32">
      {/* Header branco que aparece no scroll (close + nome) */}
      <header
        className={`safe-top fixed inset-x-0 top-0 z-30 mx-auto flex max-w-app items-center gap-2 border-b border-black/5 bg-white/95 px-2 py-2 backdrop-blur transition-opacity duration-200 ${
          collapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Link href="/" aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-black/5">
          <X size={20} strokeWidth={2} />
        </Link>
        <p className="truncate font-semibold text-ink">{p.name}</p>
      </header>

      {/* Hero da foto (vai até o topo, atrás da status bar) com botões flutuantes */}
      <div ref={imageRef} className="relative aspect-square w-full bg-black/[0.03]">
        {p.imageUrl && (
          <Image src={p.imageUrl} alt={p.name} fill sizes="480px" className="object-cover" priority />
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
        {p.promoActive && p.promoPercent && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
            -{p.promoPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{p.name}</h1>
          <div className="mt-1 flex items-baseline gap-2">
            {p.promoActive && p.promoPercent && (
              <span className="text-sm text-muted line-through">{brl(p.price)}</span>
            )}
            <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{brl(p.finalPrice)}</span>
            {p.promoActive && p.promoPercent && (
              <span className="text-sm font-semibold text-success">{p.promoPercent}% OFF</span>
            )}
          </div>
        </div>

        {p.description && <p className="text-sm text-ink/80">{p.description}</p>}

        {p.ingredients && (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-ink">Ingredientes</h2>
            <p className="text-sm text-muted">{p.ingredients}</p>
          </section>
        )}

        {/* Adicionais (extras com preço) */}
        {p.extras.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Adicionais</h2>
              <span className="text-xs text-muted">
                {p.maxExtras != null ? `${totalExtraQty}/${p.maxExtras}` : "à vontade"}
              </span>
            </div>
            <div className="card divide-y divide-black/5">
              {p.extras.map((ex) => {
                const q = extraQty[ex.id] ?? 0;
                return (
                  <div key={ex.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{ex.name}</p>
                      <p className="text-xs font-medium text-success">+ {brl(ex.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-black/10 px-1.5 py-0.5">
                      <button
                        onClick={() => decExtra(ex.id)}
                        disabled={q === 0}
                        className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5 disabled:opacity-30"
                        aria-label="Menos"
                      >
                        <IconMinus width={16} height={16} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{q}</span>
                      <button
                        onClick={() => incExtra(ex.id)}
                        disabled={extrasFull}
                        className="grid h-7 w-7 place-items-center rounded-full text-brand hover:bg-black/5 disabled:opacity-30"
                        aria-label="Mais"
                      >
                        <IconPlus width={16} height={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Remover ingredientes */}
        {p.removables.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Remover ingredientes</h2>
              <span className="text-xs text-muted">
                {p.maxRemovable != null ? `${removedSet.size}/${p.maxRemovable}` : "à vontade"}
              </span>
            </div>
            <div className="card divide-y divide-black/5">
              {p.removables.map((r) => {
                const checked = removedSet.has(r.id);
                const atMax = p.maxRemovable != null && removedSet.size >= p.maxRemovable && !checked;
                return (
                  <label key={r.id} className={`flex items-center justify-between p-3 ${atMax ? "opacity-40" : "cursor-pointer"}`}>
                    <span className="text-sm text-ink">{r.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={atMax}
                      onChange={() => toggleRemoved(r.id)}
                      className="h-5 w-5 accent-brand"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-1 text-sm font-semibold text-ink">Observações</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: ponto da carne, sem gelo…"
            className="input min-h-[64px] resize-none"
          />
        </section>
      </div>

      {/* Footer: quantidade + adicionar com total dinâmico */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-app items-center gap-3">
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label="Diminuir">
              <IconMinus width={18} height={18} />
            </button>
            <span className="w-5 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="grid h-8 w-8 place-items-center rounded-full text-brand hover:bg-black/5" aria-label="Aumentar">
              <IconPlus width={18} height={18} />
            </button>
          </div>
          <button onClick={addToCart} className="btn-primary flex-1 justify-between">
            <span>Adicionar</span>
            <span className="tabular-nums">{brl(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
