"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { OrderChat } from "@/components/OrderChat";
import { Icon } from "@/components/icons";
import { useOrder, useUpdateStatus, useOrderMessages } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { brl, shortDate } from "@/lib/format";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, user } = useRequireRole(["ADMIN", "ATTENDANT"]);
  const { data: order, isLoading } = useOrder(id);
  const { data: msgData } = useOrderMessages(id);
  const updateStatus = useUpdateStatus();
  const [chatOpen, setChatOpen] = useState(false);

  const unread = msgData?.messages.filter((m) => m.senderType === "CUSTOMER" && !m.readAt).length ?? 0;

  if (!ready) return null;

  const canCancel =
    user?.role === "ADMIN" &&
    order &&
    !["DELIVERED", "CONFIRMED_BY_CUSTOMER", "CANCELLED"].includes(order.status);

  return (
    <AdminShell>
      {isLoading ? (
        <Spinner />
      ) : !order ? (
        <EmptyState icon={<Icon.searchX width={30} height={30} />} title="Pedido não encontrado" />
      ) : (
        <>
          <PageTitle
            title={`Pedido ${order.code}`}
            subtitle={shortDate(order.createdAt)}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChatOpen(true)}
                  className="relative flex items-center gap-1.5 rounded-xl border border-brand/30 px-3 py-2 text-sm font-semibold text-brand transition active:scale-[0.98]"
                >
                  <Icon.bell width={16} height={16} /> Contatar cliente
                  {unread > 0 && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                {canCancel && (
                  <button
                    onClick={() => {
                      if (confirm("Cancelar este pedido?")) updateStatus.mutate({ id: order.id, status: "CANCELLED", note: "Cancelado pelo admin" });
                    }}
                    disabled={updateStatus.isPending}
                    className="btn-ghost text-sm text-danger"
                  >
                    {updateStatus.isPending && <Loader2 className="animate-spin" width={16} height={16} />}
                    Cancelar pedido
                  </button>
                )}
              </div>
            }
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-sm text-muted">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
            {order.courier && <span className="text-sm text-muted">🛵 {order.courier.name}</span>}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card p-4 lg:col-span-2">
              <h2 className="mb-2 font-semibold text-ink">Itens</h2>
              <ul className="divide-y divide-black/5">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between py-2 text-sm">
                    <span className="text-ink">{it.quantity}× {it.name}{it.notes ? ` (${it.notes})` : ""}</span>
                    <span className="text-muted">{brl(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-1 border-t border-black/5 pt-2 text-sm">
                <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{brl(order.subtotal)}</dd></div>
                <div className="flex justify-between text-muted"><dt>Entrega</dt><dd>{brl(order.deliveryFee)}</dd></div>
                <div className="flex justify-between font-bold text-ink"><dt>Total</dt><dd>{brl(order.total)}</dd></div>
              </dl>
            </div>

            <div className="flex flex-col gap-4">
              <div className="card p-4 text-sm">
                <h2 className="mb-1 font-semibold text-ink">Cliente</h2>
                <p className="text-muted">{order.customer.name}</p>
                {order.customer.phone && <p className="text-muted">{order.customer.phone}</p>}
                <p className="mt-2 text-muted">
                  {order.address.street}, {order.address.number} - {order.address.neighborhood}, {order.address.city}/{order.address.state}
                </p>
              </div>

              {(order.pickupPhotoUrl || order.deliveryPhotoUrl) && (
                <div className="card p-4">
                  <h2 className="mb-2 font-semibold text-ink">Fotos</h2>
                  <div className="flex gap-2">
                    {order.pickupPhotoUrl && <Photo url={order.pickupPhotoUrl} label="Expedição" />}
                    {order.deliveryPhotoUrl && <Photo url={order.deliveryPhotoUrl} label="Entrega" />}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4 p-4">
            <h2 className="mb-3 font-semibold text-ink">Histórico</h2>
            <ol className="relative ml-2 border-l-2 border-black/10">
              {order.history.map((h) => (
                <li key={h.id} className="mb-3 ml-4 last:mb-0">
                  <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-brand" />
                  <p className="text-sm font-medium text-ink">{ORDER_STATUS_LABEL[h.status]}</p>
                  <p className="text-xs text-muted">{shortDate(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</p>
                </li>
              ))}
            </ol>
          </div>

          {chatOpen && (
            <OrderChat orderId={order.id} customerName={order.customer.name} onClose={() => setChatOpen(false)} />
          )}
        </>
      )}
    </AdminShell>
  );
}

function Photo({ url, label }: { url: string; label: string }) {
  return (
    <div className="text-center">
      <Image src={url} alt={label} width={80} height={80} className="h-20 w-20 rounded-lg object-cover" unoptimized />
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
