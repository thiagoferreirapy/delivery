"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type CourierLocationEvent } from "@cabana/shared";
import { useOrder, useConfirmReceipt, useRateOrder } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getSocket } from "@/lib/socket";
import { brl } from "@/lib/format";
import { PageHeader, EmptyState, StatusBadge, Stars } from "@/components/ui";
import { OrderTrackingSkeleton } from "@/components/Skeleton";
import { Loader2 } from "lucide-react";
import { StatusTimeline } from "@/components/StatusTimeline";
import { LiveMap } from "@/components/LiveMap";

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const qc = useQueryClient();
  const { data: order, isLoading } = useOrder(id, { poll: true });
  const confirmReceipt = useConfirmReceipt();
  const rateOrder = useRateOrder();

  const [courierPos, setCourierPos] = useState<{ lat: number; lng: number } | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  // Realtime: status + localização do entregador
  useEffect(() => {
    if (!id || !ready) return;
    const socket = getSocket();
    socket.emit("order:subscribe", id);
    const onStatus = () => qc.invalidateQueries({ queryKey: ["order", id] });
    const onLocation = (e: CourierLocationEvent) => {
      if (e.orderId === id) setCourierPos({ lat: e.lat, lng: e.lng });
    };
    socket.on(SOCKET_EVENTS.ORDER_STATUS, onStatus);
    socket.on(SOCKET_EVENTS.ORDER_DELIVERED, onStatus);
    socket.on(SOCKET_EVENTS.COURIER_LOCATION, onLocation);
    return () => {
      socket.emit("order:unsubscribe", id);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, onStatus);
      socket.off(SOCKET_EVENTS.ORDER_DELIVERED, onStatus);
      socket.off(SOCKET_EVENTS.COURIER_LOCATION, onLocation);
    };
  }, [id, ready, qc]);

  if (!ready || isLoading) return <OrderTrackingSkeleton />;
  if (!order) return <EmptyState emoji="😕" title="Pedido não encontrado" />;

  const courier = order.courier;
  const liveCourier =
    courierPos ??
    (courier?.currentLat != null && courier?.currentLng != null
      ? { lat: courier.currentLat, lng: courier.currentLng }
      : null);
  const dest =
    order.address.lat != null && order.address.lng != null
      ? { lat: order.address.lat, lng: order.address.lng }
      : null;

  const showReceipt = order.status === "DELIVERED";
  const showRating = order.status === "CONFIRMED_BY_CUSTOMER" && !order.rating;

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-10">
      <PageHeader title={`Pedido ${order.code}`} back="/pedidos" />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="font-display font-bold text-brand">{brl(order.total)}</span>
        </div>

        {/* Em rota: entregador + mapa + aviso */}
        {order.status === "IN_ROUTE" && courier && (
          <section className="card flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-xl">🛵</span>
              <div>
                <p className="font-semibold text-ink">{courier.name}</p>
                <p className="text-xs text-muted">Seu pedido está a caminho</p>
              </div>
            </div>
            <LiveMap courier={liveCourier} dest={dest} etaMinutes={15} />
            <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
              ℹ️ O entregador pode estar entregando outros pedidos na região, então o trajeto pode variar.
            </p>
          </section>
        )}

        {/* Entregue: confirmar recebimento + foto */}
        {showReceipt && (
          <section className="card flex flex-col gap-3 p-4">
            <p className="font-display text-lg font-bold text-ink">Seu pedido chegou?</p>
            {order.deliveryPhotoUrl && (
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black/5">
                <Image src={order.deliveryPhotoUrl} alt="Foto da entrega" fill sizes="480px" className="object-cover" unoptimized />
              </div>
            )}
            <p className="text-sm text-muted">Foto registrada pelo entregador no momento da entrega.</p>
            <button onClick={() => confirmReceipt.mutate(order.id)} disabled={confirmReceipt.isPending} className="btn-primary w-full">
              {confirmReceipt.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
              {confirmReceipt.isPending ? "Confirmando…" : "Confirmar recebimento"}
            </button>
          </section>
        )}

        {/* Avaliação */}
        {showRating && (
          <section className="card flex flex-col items-center gap-3 p-4">
            <p className="font-display text-lg font-bold text-ink">Avalie seu pedido</p>
            <Stars value={stars} onChange={setStars} size={30} />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Deixe um comentário (opcional)" className="input min-h-[64px] resize-none" />
            <button
              onClick={() => rateOrder.mutate({ orderId: order.id, stars, comment: comment || undefined })}
              disabled={rateOrder.isPending}
              className="btn-primary w-full"
            >
              {rateOrder.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
              {rateOrder.isPending ? "Enviando…" : "Enviar avaliação"}
            </button>
          </section>
        )}

        {order.rating && (
          <section className="card flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-ink">Sua avaliação</span>
            <Stars value={order.rating.stars} size={20} />
          </section>
        )}

        {/* Timeline */}
        <section className="card p-4">
          <h2 className="mb-3 font-semibold text-ink">Acompanhamento</h2>
          <StatusTimeline current={order.status} history={order.history} />
        </section>

        {/* Itens */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-ink">Itens</h2>
          <ul className="divide-y divide-black/5">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between py-2 text-sm">
                <span className="text-ink">{it.quantity}× {it.name}</span>
                <span className="text-muted">{brl(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-black/5 pt-2 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{brl(order.subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Entrega</dt><dd>{brl(order.deliveryFee)}</dd></div>
            <div className="flex justify-between font-bold text-ink"><dt>Total</dt><dd>{brl(order.total)}</dd></div>
          </dl>
        </section>

        {/* Endereço */}
        <section className="card p-4 text-sm">
          <h2 className="mb-1 font-semibold text-ink">Entrega em</h2>
          <p className="text-muted">
            {order.address.street}, {order.address.number}
            {order.address.complement ? ` — ${order.address.complement}` : ""}
            <br />
            {order.address.neighborhood}, {order.address.city}/{order.address.state}
          </p>
        </section>
      </div>
    </div>
  );
}
