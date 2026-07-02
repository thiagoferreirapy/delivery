"use client";
import { useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useOrders } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { brl, shortDate } from "@/lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

export default function OrdersPage() {
  const { ready } = useRequireRole(["ADMIN", "ATTENDANT"]);
  const [status, setStatus] = useState("");
  const [code, setCode] = useState("");
  const { data: orders = [], isLoading } = useOrders({ status: status || undefined, code: code || undefined });

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
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState emoji="🧾" title="Nenhum pedido" />
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
                  <td className="hidden px-4 py-3 text-muted md:table-cell">{o.courier?.name ?? "—"}</td>
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
