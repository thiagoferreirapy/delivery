"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ORDER_STATUS_LABEL, SOCKET_EVENTS, type OrderStatus, type OrderStatusEvent } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, EmptyState, StatusBadge } from "@/components/ui";
import { TableSkeleton } from "@/components/Skeleton";
import { Icon } from "@/components/icons";
import { useOrders } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { getSocket } from "@/lib/socket";
import { brl, shortDate } from "@/lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

export default function OrdersPage() {
  const { ready } = useRequireRole(["ADMIN", "ATTENDANT"]);
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [code, setCode] = useState("");
  const { data: orders = [], isLoading } = useOrders({ status: status || undefined, code: code || undefined });

  // Avisa (toast) quando um novo pedido é confirmado, enquanto estiver nesta página.
  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const onNew = (e: OrderStatusEvent) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Novo pedido${e?.code ? ` - ${e.code}` : ""}`, {
        description: "Um novo pedido acabou de entrar.",
      });
    };
    socket.on(SOCKET_EVENTS.ORDER_NEW, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.ORDER_NEW, onNew);
    };
  }, [ready, qc]);

  if (!ready) return null;

  return (
    <AdminShell>
      <PageTitle
        title="Pedidos"
        subtitle="Todos os pedidos"
        action={
          <Link href="/pedidos/novo" className="btn-primary text-sm">
            <Icon.plus width={16} height={16} /> Novo pedido
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
          <Icon.search className="text-muted" width={16} height={16} />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Buscar por código (CL-0001)" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[220px]">
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Icon.orders width={30} height={30} />} title="Nenhum pedido" subtitle="Os pedidos aparecem aqui conforme chegam." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-black/5 bg-black/[0.02] text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Entregador</th>
                <th className="hidden px-4 py-3 sm:table-cell">Data</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/pedidos/${o.id}`} className="font-semibold text-brand">{o.code}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{o.customer.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">{o.courier?.name ?? "-"}</td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{shortDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{brl(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
