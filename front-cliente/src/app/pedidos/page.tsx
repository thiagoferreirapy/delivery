"use client";
import Link from "next/link";
import { useOrders } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { brl, shortDate } from "@/lib/format";
import { TabShell } from "@/components/TabShell";
import { PageHeader, Spinner, EmptyState, StatusBadge } from "@/components/ui";

export default function OrdersPage() {
  const { ready } = useRequireAuth();
  const { data: orders = [], isLoading } = useOrders();

  return (
    <TabShell>
      <PageHeader title="Meus pedidos" />
      {!ready || isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState emoji="🧾" title="Nenhum pedido ainda" subtitle="Seus pedidos aparecem aqui." />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/pedido/${o.id}`} className="card flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{o.code}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-xs text-muted">
                  {shortDate(o.createdAt)} • {o.items.length} {o.items.length === 1 ? "item" : "itens"}
                </p>
              </div>
              <span className="font-display font-bold text-brand">{brl(o.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </TabShell>
  );
}
