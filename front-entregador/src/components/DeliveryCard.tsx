"use client";
import Link from "next/link";
import type { OrderDTO } from "@cabana/shared";
import { StatusBadge } from "./ui";
import { IconMapPin, IconClock } from "./icons";
import { timeAgo } from "@/lib/format";
import { useDeliveryAction } from "@/lib/queries";

export function DeliveryCard({ order }: { order: OrderDTO }) {
  const action = useDeliveryAction();
  const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <article className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <Link href={`/entrega/${order.id}`} className="font-bold text-ink">{order.code}</Link>
        <StatusBadge status={order.status} />
      </div>
      <div className="mb-1 flex items-start gap-1.5 text-sm text-ink">
        <IconMapPin className="mt-0.5 shrink-0 text-brand" width={16} height={16} />
        <span>
          {order.address.street}, {order.address.number}
          {order.address.complement ? ` — ${order.address.complement}` : ""}
          <span className="block text-muted">{order.address.neighborhood}, {order.address.city}</span>
        </span>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <IconClock width={14} height={14} /> {timeAgo(order.createdAt)} · {itemsCount} itens · {order.customer.name}
      </p>

      {order.status === "DISPATCHED" && (
        <button onClick={() => action.mutate({ id: order.id, action: "pickup" })} disabled={action.isPending} className="btn-primary w-full text-sm">
          Confirmar recebimento
        </button>
      )}
      {order.status === "PICKED_UP" && (
        <button onClick={() => action.mutate({ id: order.id, action: "start-route" })} disabled={action.isPending} className="btn-primary w-full text-sm">
          Iniciar rota
        </button>
      )}
      {order.status === "IN_ROUTE" && (
        <Link href={`/entrega/${order.id}`} className="btn-primary w-full text-sm">
          Confirmar entrega
        </Link>
      )}
    </article>
  );
}
