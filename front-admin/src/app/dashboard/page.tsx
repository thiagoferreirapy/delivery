"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ORDER_STATUS_LABEL, SOCKET_EVENTS, type OrderStatus } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, StatusBadge } from "@/components/ui";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useStats, useOrders } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { getSocket } from "@/lib/socket";
import { brl, timeAgo } from "@/lib/format";

export default function DashboardPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const qc = useQueryClient();
  const { data: stats, isLoading } = useStats();
  const { data: orders = [] } = useOrders();

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    };
    socket.on(SOCKET_EVENTS.KITCHEN_NEW, refresh);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.KITCHEN_NEW, refresh);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
    };
  }, [ready, qc]);

  if (!ready) return null;

  const chartData = stats
    ? Object.entries(stats.byStatus).map(([status, count]) => ({
        status,
        label: ORDER_STATUS_LABEL[status as OrderStatus] ?? status,
        count,
      }))
    : [];

  return (
    <AdminShell>
      <PageTitle title="Dashboard" subtitle="Visão geral de hoje" />
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Pedidos hoje" value={String(stats?.ordersToday ?? 0)} />
            <Kpi label="Faturamento hoje" value={brl(stats?.revenueToday ?? 0)} />
            <Kpi label="Ticket médio" value={brl(stats?.avgTicket ?? 0)} />
            <Kpi label="Avaliação média" value={stats?.avgRating ? `★ ${stats.avgRating}` : "—"} sub={`${stats?.ratingCount ?? 0} avaliações`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-ink">Pedidos por status</h2>
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Sem pedidos ainda.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -20 }}>
                      <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [v, "Pedidos"]} labelFormatter={(l) => ORDER_STATUS_LABEL[l as OrderStatus] ?? l} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill="#6E1423" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-ink">Pedidos recentes</h2>
              <div className="flex flex-col divide-y divide-black/5">
                {orders.slice(0, 8).map((o) => (
                  <Link key={o.id} href={`/pedidos/${o.id}`} className="flex items-center justify-between gap-2 py-2.5 hover:opacity-80">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink">{o.code}</span>
                      <span className="ml-2 text-xs text-muted">{timeAgo(o.createdAt)}</span>
                    </div>
                    <StatusBadge status={o.status} />
                    <span className="w-20 text-right text-sm font-semibold text-ink tabular-nums">{brl(o.total)}</span>
                  </Link>
                ))}
                {orders.length === 0 && <p className="py-8 text-center text-sm text-muted">Nenhum pedido.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
