"use client";
import Link from "next/link";
import Image from "next/image";
import { PAYMENT_METHOD_LABEL, type OrderDTO } from "@cabana/shared";
import { useOrders } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { brl, shortDate } from "@/lib/format";
import { TabShell } from "@/components/TabShell";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { OrderListSkeleton } from "@/components/Skeleton";
import { IconReceipt } from "@/components/icons";

const ACTIVE = new Set(["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "PICKED_UP", "IN_ROUTE"]);

export default function OrdersPage() {
  const { ready } = useRequireAuth();
  const { data: orders = [], isLoading } = useOrders();

  return (
    <TabShell>
      <PageHeader title="Meus pedidos" />
      {!ready || isLoading ? (
        <OrderListSkeleton count={4} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<IconReceipt width={30} height={30} />} title="Nenhum pedido ainda" subtitle="Seus pedidos aparecem aqui." />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {orders.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </TabShell>
  );
}

function OrderCard({ o }: { o: OrderDTO }) {
  const first = o.items[0];
  const count = o.items.reduce((n, i) => n + i.quantity, 0);
  const summary = o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
  const isActive = ACTIVE.has(o.status);
  const inRoute = o.status === "IN_ROUTE" || o.status === "PICKED_UP";

  return (
    <Link
      href={`/pedido/${o.id}`}
      className="card block overflow-hidden p-3 transition active:scale-[0.99] hover:shadow-cardHover"
    >
      <div className="flex gap-3">
        {/* Miniatura do 1º item (ou ícone) */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand/5">
          {first?.imageUrl ? (
            <Image src={first.imageUrl} alt={first.name} fill sizes="64px" className="object-cover" unoptimized />
          ) : (
            <span className="grid h-full w-full place-items-center text-brand">
              <IconReceipt width={24} height={24} />
            </span>
          )}
          {o.items.length > 1 && (
            <span className="absolute bottom-0 right-0 rounded-tl-lg bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
              +{o.items.length - 1}
            </span>
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 font-display font-bold text-ink">
              {isActive && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand" />}
              {o.code}
            </span>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-1 truncate text-sm text-ink/80">{summary}</p>
          <p className="mt-0.5 text-xs text-muted">
            {shortDate(o.createdAt)} • {count} {count === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>

      {/* Rodapé: entregador (em rota) ou forma de pagamento + total */}
      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2.5">
        {inRoute && o.courier ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand">
            <span className="text-sm leading-none">🛵</span> {o.courier.name}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span>
        )}
        <span className="font-display text-base font-bold text-ink tabular-nums">{brl(o.total)}</span>
      </div>
    </Link>
  );
}
