"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { PAYMENT_METHOD_LABEL } from "@cabana/shared";
import { PageHeader, Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { LiveMap } from "@/components/LiveMap";
import { IconCamera, IconMapPin, IconPhone, IconMoney, IconCheck } from "@/components/icons";
import { useDelivery, useDeliveryAction } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLocationStore } from "@/lib/location-store";
import { apiUpload } from "@/lib/api";
import { brl } from "@/lib/format";

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const { data: order, isLoading } = useDelivery(id);
  const action = useDeliveryAction();
  const { lat, lng } = useLocationStore();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || isLoading) return <Spinner />;
  if (!order) return <EmptyState emoji="😕" title="Entrega não encontrada" />;

  const needsPayment = order.paymentMethod !== "PIX";
  const me = lat != null && lng != null ? { lat, lng } : null;
  const dest = order.address.lat != null && order.address.lng != null ? { lat: order.address.lat, lng: order.address.lng } : null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await apiUpload(file);
      setPhotoUrl(url);
    } finally {
      setUploading(false);
    }
  }

  async function finishDelivery() {
    setError(null);
    if (!photoUrl) return setError("Tire a foto da entrega");
    if (needsPayment && !paymentConfirmed) return setError("Confirme o recebimento do pagamento");
    try {
      await action.mutateAsync({ id: order!.id, action: "deliver", photoUrl, paymentConfirmed });
    } catch (e: any) {
      setError(e?.message ?? "Falha ao finalizar");
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-8">
      <PageHeader title={`Entrega ${order.code}`} back="/" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="text-sm font-semibold text-ink">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
        </div>

        {/* Cliente + endereço */}
        <section className="card p-4 text-sm">
          <p className="font-semibold text-ink">{order.customer.name}</p>
          {order.customer.phone && (
            <a href={`tel:${order.customer.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-brand">
              <IconPhone width={15} height={15} /> {order.customer.phone}
            </a>
          )}
          <p className="mt-2 flex items-start gap-1.5 text-muted">
            <IconMapPin className="mt-0.5 shrink-0 text-brand" width={16} height={16} />
            <span>
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` — ${order.address.complement}` : ""}
              <br />
              {order.address.neighborhood}, {order.address.city}/{order.address.state}
            </span>
          </p>
        </section>

        {/* Mapa quando em rota */}
        {order.status === "IN_ROUTE" && <LiveMap me={me} dest={dest} />}

        {/* Itens */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-ink">Itens</h2>
          <ul className="space-y-1 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span className="text-ink"><b className="text-brand">{it.quantity}×</b> {it.name}</span>
                <span className="text-muted">{brl(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-black/5 pt-2 font-bold text-ink">
            <span>Total</span>
            <span>{brl(order.total)}</span>
          </div>
        </section>

        {/* Ações por status */}
        {order.status === "DISPATCHED" && (
          <button onClick={() => action.mutate({ id: order.id, action: "pickup" })} disabled={action.isPending} className="btn-primary w-full">
            Confirmar recebimento do pedido
          </button>
        )}

        {order.status === "PICKED_UP" && (
          <button onClick={() => action.mutate({ id: order.id, action: "start-route" })} disabled={action.isPending} className="btn-primary w-full">
            Iniciar rota
          </button>
        )}

        {order.status === "IN_ROUTE" && (
          <section className="card flex flex-col gap-3 p-4">
            <h2 className="font-semibold text-ink">Confirmar entrega</h2>
            {/* Foto */}
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <Image src={photoUrl} alt="Foto da entrega" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" unoptimized />
              ) : (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-black/20 text-muted hover:bg-black/5">
                  <IconCamera />
                  <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
                </label>
              )}
              <span className="text-sm text-muted">{uploading ? "Enviando foto…" : "Foto do pedido na entrega (obrigatória)"}</span>
            </div>

            {/* Pagamento na entrega */}
            {needsPayment && (
              <label className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-ink">
                <input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="accent-brand" />
                <IconMoney width={16} height={16} className="text-warning" />
                Confirmo o recebimento de <b>{brl(order.total)}</b> em {PAYMENT_METHOD_LABEL[order.paymentMethod]}
              </label>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
            <button onClick={finishDelivery} disabled={action.isPending || uploading} className="btn-primary w-full">
              <IconCheck width={18} height={18} /> Finalizar entrega
            </button>
          </section>
        )}

        {order.status === "DELIVERED" && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
            Entrega concluída — aguardando confirmação do cliente.
          </div>
        )}
        {order.status === "CONFIRMED_BY_CUSTOMER" && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
            ✅ Entrega confirmada pelo cliente.
          </div>
        )}
      </div>
    </div>
  );
}
