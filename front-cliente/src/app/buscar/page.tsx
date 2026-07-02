"use client";
import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useProducts } from "@/lib/queries";
import { EmptyState } from "@/components/ui";
import { Skeleton } from "@/components/Skeleton";
import { IconSearch, IconChevronLeft, IconCart } from "@/components/icons";
import { useCartStore } from "@/lib/cart-store";
import { brl } from "@/lib/format";

// Destaca o trecho buscado dentro do nome (estilo autocomplete).
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-brand">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { data: products = [], isLoading } = useProducts({ search: q.trim() || undefined });
  const term = q.trim();

  return (
    <div className="mx-auto min-h-dvh max-w-app bg-cream">
      {/* Barra de busca (voltar + input + limpar + carrinho) */}
      <header className="safe-top sticky top-0 z-40 flex items-center gap-2 border-b border-black/5 bg-white px-2 py-2">
        <Link href="/" aria-label="Voltar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-black/5">
          <IconChevronLeft width={22} height={22} />
        </Link>
        <label className="flex flex-1 items-center gap-2 rounded-full bg-black/5 px-3 py-2">
          <IconSearch className="text-muted" width={18} height={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar na Cabana…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Limpar" className="grid h-6 w-6 place-items-center rounded-full bg-black/10 text-muted">
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </label>
        <Link href="/carrinho" aria-label="Carrinho" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-black/5">
          <IconCart width={22} height={22} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* Sugestões / resultados */}
      {term === "" ? (
        <EmptyState emoji="🔎" title="O que você quer comer?" subtitle="Busque por pratos, lanches, bebidas…" />
      ) : isLoading ? (
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState emoji="😕" title="Nada encontrado" subtitle={`Nenhum item para "${term}".`} />
      ) : (
        <ul className="flex flex-col divide-y divide-black/5">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/produto/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-black/[0.04]">
                <IconSearch className="shrink-0 text-muted" width={18} height={18} />
                <span className="flex-1 truncate text-[15px] text-ink">
                  <Highlight text={p.name} query={term} />
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">{brl(p.finalPrice)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
