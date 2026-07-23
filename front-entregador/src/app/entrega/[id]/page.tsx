"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PAYMENT_METHOD_LABEL, SOCKET_EVENTS } from "@cabana/shared";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { DeliveryDetailSkeleton } from "@/components/Skeleton";
import { LiveMap } from "@/components/LiveMap";
import { OrderChat } from "@/components/OrderChat";
import { IconCamera, IconMapPin, IconPhone, IconMoney, IconCheck, IconMessage, IconPackageX } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { useDelivery, useDeliveryAction, useOrderMessages } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLocationStore } from "@/lib/location-store";
import { apiUpload } from "@/lib/api";
import { brl } from "@/lib/format";

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { ready } = useRequireAuth();
  const { data: order, isLoading } = useDelivery(id);
  const { data: msgData } = useOrderMessages(id);
  const action = useDeliveryAction();
  const { lat, lng } = useLocationStore();

  // Tempo real: acompanha mudanças de status do pedido (ex.: cliente confirma o
  // recebimento) para atualizar a tela na hora, sem precisar recarregar.
  useEffect(() => {
    if (!id || !ready) return;
    const socket = getSocket();
    socket.emit("order:subscribe", id);
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["delivery", id] });
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    };
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    socket.on(SOCKET_EVENTS.ORDER_DELIVERED, refresh);
    return () => {
      socket.emit("order:unsubscribe", id);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
      socket.off(SOCKET_EVENTS.ORDER_DELIVERED, refresh);
    };
  }, [id, ready, qc]);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState(false);

  const unread = msgData?.messages.filter((m) => m.senderType === "CUSTOMER" && !m.readAt).length ?? 0;

  if (!ready || isLoading)
    return (
      <div className="mx-auto min-h-dvh max-w-app pb-8">
        <PageHeader title="Entrega" back="/" />
        <DeliveryDetailSkeleton />
      </div>
    );
  if (!order) return <EmptyState icon={<IconPackageX width={30} height={30} />} title="Entrega não encontrada" />;

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
      const msg = e?.message ?? "Falha ao finalizar";
      setError(msg);
      toast.error(msg);
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
              {order.address.complement ? `, ${order.address.complement}` : ""}
              <br />
              {order.address.neighborhood}, {order.address.city}/{order.address.state}
            </span>
          </p>
        </section>

        {/* Falar com o cliente (em rota) */}
        {order.status === "IN_ROUTE" && (
          <button
            onClick={() => setChat(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand/30 py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98]"
          >
            <IconMessage width={16} height={16} /> Falar com o cliente
            {unread > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        )}

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
            {action.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            Confirmar recebimento do pedido
          </button>
        )}

        {order.status === "PICKED_UP" && (
          <button
            onClick={() =>
              action.mutate(
                { id: order.id, action: "start-route" },
                { onSuccess: () => router.push(`/rota?order=${order.id}`) }
              )
            }
            disabled={action.isPending}
            className="btn-primary w-full"
          >
            {action.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
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
              {action.isPending ? <Loader2 className="animate-spin" width={18} height={18} /> : <IconCheck width={18} height={18} />} Finalizar entrega
            </button>
          </section>
        )}

        {order.status === "DELIVERED" && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
            Entrega concluída. Aguardando confirmação do cliente.
          </div>
        )}
        {order.status === "CONFIRMED_BY_CUSTOMER" && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
            ✅ Entrega confirmada pelo cliente.
          </div>
        )}
      </div>

      {chat && <OrderChat orderId={order.id} customerName={order.customer.name} onClose={() => setChat(false)} />}
    </div>
  );
}
