"use client";
import { useMemo, useState } from "react";
import type { OrderStatus } from "@cabana/shared";
import { CourierShell } from "@/components/CourierShell";
import { DeliveryCard } from "@/components/DeliveryCard";
import { EmptyState } from "@/components/ui";
import { DeliveryListSkeleton } from "@/components/Skeleton";
import { IconSearch, IconSearchX, IconPackageCheck } from "@/components/icons";
import { useDeliveries } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";

type Filter = "all" | "DISPATCHED" | "PICKED_UP" | "IN_ROUTE";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "DISPATCHED", label: "A coletar" },
  { key: "PICKED_UP", label: "Coletadas" },
  { key: "IN_ROUTE", label: "Em rota" },
];

export default function DeliveriesPage() {
  const { ready } = useRequireAuth();
  const { data: deliveries = [], isLoading } = useDeliveries();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const active = useMemo(
    () => deliveries.filter((d) => ["DISPATCHED", "PICKED_UP", "IN_ROUTE"].includes(d.status)),
    [deliveries]
  );
  const counts = useMemo(
    () => ({
      all: active.length,
      DISPATCHED: active.filter((d) => d.status === "DISPATCHED").length,
      PICKED_UP: active.filter((d) => d.status === "PICKED_UP").length,
      IN_ROUTE: active.filter((d) => d.status === "IN_ROUTE").length,
    }),
    [active]
  );
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return active.filter((d) => {
      if (filter !== "all" && d.status !== (filter as OrderStatus)) return false;
      if (!term) return true;
      const hay = `${d.code} ${d.customer.name} ${d.address.street} ${d.address.neighborhood} ${d.address.city}`.toLowerCase();
      return hay.includes(term);
    });
  }, [active, filter, q]);

  if (!ready) return null;

  return (
    <CourierShell>
      <div className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Minhas entregas</h2>

        {/* Busca */}
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
          <IconSearch className="text-muted" width={16} height={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, cliente ou bairro"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        {/* Filtros por status */}
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  on ? "bg-brand text-cream" : "bg-black/[0.05] text-muted"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 text-[11px] font-bold ${on ? "bg-cream/25 text-cream" : "bg-black/10 text-muted"}`}>
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <DeliveryListSkeleton count={3} />
        ) : active.length === 0 ? (
          <EmptyState icon={<IconPackageCheck width={30} height={30} />} title="Tudo em dia!" subtitle="Nenhuma entrega atribuída no momento." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<IconSearchX width={30} height={30} />} title="Nada encontrado" subtitle="Ajuste a busca ou o filtro." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((o) => (
              <DeliveryCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </CourierShell>
  );
}
