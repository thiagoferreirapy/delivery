"use client";
import Link from "next/link";
import { CourierShell } from "@/components/CourierShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { HistoryListSkeleton } from "@/components/Skeleton";
import { useDeliveries } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { brl, shortDate } from "@/lib/format";

export default function HistoryPage() {
  const { ready } = useRequireAuth();
  const { data: deliveries = [], isLoading } = useDeliveries(true);

  if (!ready) return null;

  return (
    <CourierShell>
      <div className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Histórico</h2>
        {isLoading ? (
          <HistoryListSkeleton count={4} />
        ) : deliveries.length === 0 ? (
          <EmptyState emoji="📭" title="Sem entregas concluídas" />
        ) : (
          <div className="flex flex-col gap-3">
            {deliveries.map((o) => (
              <Link key={o.id} href={`/entrega/${o.id}`} className="card flex items-center justify-between p-3">
                <div>
                  <p className="font-semibold text-ink">{o.code}</p>
                  <p className="text-xs text-muted">{shortDate(o.createdAt)} · {o.address.neighborhood}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-ink tabular-nums">{brl(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CourierShell>
  );
}
