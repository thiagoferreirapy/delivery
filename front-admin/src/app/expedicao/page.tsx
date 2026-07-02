"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, EmptyState } from "@/components/ui";
import { DispatchSkeleton } from "@/components/Skeleton";
import { Icon } from "@/components/icons";
import { useDispatchOrders, useDispatchCouriers, useAssignCourier } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { getSocket } from "@/lib/socket";
import { apiUpload } from "@/lib/api";
import { timeAgo } from "@/lib/format";

export default function DispatchPage() {
  const { ready } = useRequireRole(["ADMIN", "DISPATCH"]);
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useDispatchOrders();
  const { data: couriers = [] } = useDispatchCouriers();
  const assign = useAssignCourier();

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ["dispatch"] });
    socket.on(SOCKET_EVENTS.DISPATCH_UPDATE, refresh);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.DISPATCH_UPDATE, refresh);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
    };
  }, [ready, qc]);

  if (!ready) return null;

  return (
    <AdminShell>
      <PageTitle title="Expedição" subtitle="Pedidos prontos para encaminhar" />
      {isLoading ? (
        <DispatchSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState emoji="📦" title="Nenhum pedido pronto" subtitle="Pedidos finalizados na cozinha aparecem aqui." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <DispatchCard
              key={o.id}
              order={o}
              couriers={couriers}
              onAssign={(courierId, photoUrl) => assign.mutate({ id: o.id, courierId, photoUrl })}
              busy={assign.isPending}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function DispatchCard({
  order,
  couriers,
  onAssign,
  busy,
}: {
  order: OrderDTO;
  couriers: { id: string; name: string }[];
  onAssign: (courierId: string, photoUrl?: string) => void;
  busy: boolean;
}) {
  const [courierId, setCourierId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  return (
    <article className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-ink">{order.code}</span>
        <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
      </div>
      <p className="mb-1 text-sm text-muted">
        {order.address.street}, {order.address.number} — {order.address.neighborhood}
      </p>
      <p className="mb-3 text-xs text-muted">{order.items.reduce((n, i) => n + i.quantity, 0)} itens · {order.customer.name}</p>

      <label className="label">Entregador</label>
      <select value={courierId} onChange={(e) => setCourierId(e.target.value)} className="input mb-3">
        <option value="">Selecione…</option>
        {couriers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="mb-3 flex items-center gap-3">
        {photoUrl ? (
          <Image src={photoUrl} alt="Foto do pedido" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" unoptimized />
        ) : (
          <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-black/20 text-muted hover:bg-black/5">
            <Icon.camera />
            <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          </label>
        )}
        <span className="text-xs text-muted">{uploading ? "Enviando foto…" : "Foto do pedido (opcional)"}</span>
      </div>

      <button
        onClick={() => courierId && onAssign(courierId, photoUrl ?? undefined)}
        disabled={!courierId || busy || uploading}
        className="btn-primary w-full text-sm"
      >
        {busy && <Loader2 className="animate-spin" width={16} height={16} />}
        Encaminhar ao entregador
      </button>
    </article>
  );
}
