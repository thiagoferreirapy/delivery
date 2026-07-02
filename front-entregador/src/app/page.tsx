"use client";
import { CourierShell } from "@/components/CourierShell";
import { DeliveryCard } from "@/components/DeliveryCard";
import { EmptyState } from "@/components/ui";
import { DeliveryListSkeleton } from "@/components/Skeleton";
import { useDeliveries } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function DeliveriesPage() {
  const { ready } = useRequireAuth();
  const { data: deliveries = [], isLoading } = useDeliveries();

  if (!ready) return null;

  const active = deliveries.filter((d) => ["DISPATCHED", "PICKED_UP", "IN_ROUTE"].includes(d.status));

  return (
    <CourierShell>
      <div className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Minhas entregas</h2>
        {isLoading ? (
          <DeliveryListSkeleton count={3} />
        ) : active.length === 0 ? (
          <EmptyState emoji="✅" title="Tudo em dia!" subtitle="Nenhuma entrega atribuída no momento." />
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((o) => (
              <DeliveryCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </CourierShell>
  );
}
