"use client";
import { useState } from "react";
import { useProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { TabShell } from "@/components/TabShell";
import { Spinner, EmptyState } from "@/components/ui";
import { IconSearch } from "@/components/icons";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useProducts({ search: search || undefined });

  return (
    <TabShell>
      <header className="sticky top-0 z-40 bg-cream/95 px-4 py-3 backdrop-blur safe-top">
        <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-card">
          <IconSearch className="text-muted" width={18} height={18} />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pratos, lanches, bebidas…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
          />
        </label>
      </header>

      <section className="px-4 pt-2">
        {isLoading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState emoji="🔎" title={search ? "Nada encontrado" : "O que você quer comer?"} subtitle={search ? "Tente outro termo." : "Digite para buscar no cardápio."} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </TabShell>
  );
}
