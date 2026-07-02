"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyHeader } from "@/components/StickyHeader";
import { CategoryHero } from "@/components/CategoryHero";
import { ProductCard } from "@/components/ProductCard";
import { TabShell } from "@/components/TabShell";
import { EmptyState } from "@/components/ui";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useCategories, useProducts, useAddresses } from "@/lib/queries";
import { useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({
    categoryId: category ?? undefined,
    search: search || undefined,
  });
  const { data: addresses = [] } = useAddresses();

  const addressLabel = useMemo(() => {
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    return def ? `${def.street}, ${def.number}` : null;
  }, [addresses]);

  const promo = useMemo(() => products.find((p) => p.promoActive && p.promoPercent), [products]);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === category) ?? null,
    [categories, category]
  );

  return (
    <TabShell>
      <StickyHeader
        userInitial={user?.name?.[0]?.toUpperCase() ?? "?"}
        address={addressLabel}
        onAddressClick={() => router.push(user ? "/perfil" : "/login")}
        search={search}
        onSearch={setSearch}
        categories={categories}
        activeCategory={category}
        onCategory={setCategory}
        onBell={() => router.push("/pedidos")}
      />

      {/* Destaque: card da categoria selecionada; no "Tudo", banner de promoção */}
      {!search &&
        (selectedCategory ? (
          <CategoryHero category={selectedCategory} count={products.length} />
        ) : promo ? (
          <button
            onClick={() => router.push(`/produto/${promo.id}`)}
            className="mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-3 overflow-hidden rounded-2xl bg-brand p-4 text-left text-cream shadow-soft"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cream/80">Promoção</p>
              <p className="text-xl font-bold leading-tight">{promo.promoPercent}% OFF</p>
              <p className="text-sm text-cream/90">{promo.name}</p>
            </div>
            <span className="ml-auto rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-brand">
              Ver
            </span>
          </button>
        ) : null)}

      {/* Grid de produtos */}
      <section className="px-4">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState emoji="🔎" title="Nada encontrado" subtitle="Tente outra busca ou categoria." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="px-4 py-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} Cabana Lanches. Todos os direitos reservados.
      </footer>
    </TabShell>
  );
}
