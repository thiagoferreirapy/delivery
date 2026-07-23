"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from "recharts";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  SOCKET_EVENTS,
  type OrderStatus,
  type PaymentMethod,
} from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, StatusBadge } from "@/components/ui";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useStats, useOrders } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { getSocket } from "@/lib/socket";
import { brl, timeAgo } from "@/lib/format";

const BRAND = "#6E1423";
const dm = (iso: string) => {
  const p = iso.split("-");
  return `${p[2]}/${p[1]}`;
};

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
  if (isLoading || !stats) {
    return (
      <AdminShell>
        <PageTitle title="Dashboard" subtitle="Visão geral" />
        <DashboardSkeleton />
      </AdminShell>
    );
  }

  const revenueData = stats.revenueByDay.map((d) => ({ ...d, label: dm(d.date) }));
  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    status,
    label: ORDER_STATUS_LABEL[status as OrderStatus] ?? status,
    count,
  }));
  const payMax = Math.max(1, ...stats.paymentMethods.map((p) => p.count));
  const prodMax = Math.max(1, ...stats.topProducts.map((p) => p.qty));

  return (
    <AdminShell>
      <PageTitle title="Dashboard" subtitle="Visão geral do restaurante" />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Kpi label="Pedidos hoje" value={String(stats.ordersToday)} trend={<Trend today={stats.ordersToday} yesterday={stats.ordersYesterday} />} />
        <Kpi label="Faturamento hoje" value={brl(stats.revenueToday)} trend={<Trend today={stats.revenueToday} yesterday={stats.revenueYesterday} />} />
        <Kpi label="Ticket médio" value={brl(stats.avgTicket)} sub="por pedido hoje" />
        <Kpi label="Em andamento" value={String(stats.activeOrders)} sub="pedidos ativos agora" />
        <Kpi label="Entregues hoje" value={String(stats.deliveredToday)} />
        <Kpi label="Faturamento 7 dias" value={brl(stats.revenue7d)} sub={`${stats.orders7d} pedidos`} />
        <Kpi label="Avaliação média" value={stats.avgRating ? `★ ${stats.avgRating}` : "-"} sub={`${stats.ratingCount} avaliações`} />
        <Kpi label="Clientes" value={String(stats.customersTotal)} sub="cadastrados" />
      </div>

      {/* Faturamento por dia (14 dias) */}
      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Faturamento nos últimos 14 dias</h2>
          <span className="text-sm font-semibold text-brand">{brl(stats.revenue7d)} <span className="text-xs font-normal text-muted">nos últimos 7</span></span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={<RevenueTooltip />} />
              <Bar dataKey="revenue" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formas de pagamento + Pedidos por status */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink">Formas de pagamento</h2>
          {stats.paymentMethods.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Sem dados ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.paymentMethods.map((p) => (
                <BarRow
                  key={p.method}
                  label={PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method}
                  value={p.count}
                  max={payMax}
                  display={`${p.count}`}
                  sub={brl(p.total)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink">Pedidos por status</h2>
          {statusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Sem pedidos ainda.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ left: -20, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="status" tick={{ fontSize: 9, fill: "#9ca3af" }} interval={0} angle={-30} textAnchor="end" height={54} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} formatter={(v: number) => [v, "Pedidos"]} labelFormatter={(l) => ORDER_STATUS_LABEL[l as OrderStatus] ?? l} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={BRAND} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top produtos + Pedidos recentes */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink">Produtos mais vendidos</h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Sem vendas ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.topProducts.map((p) => (
                <BarRow key={p.name} label={p.name} value={p.qty} max={prodMax} display={`${p.qty}×`} sub={brl(p.revenue)} />
              ))}
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
    </AdminShell>
  );
}

function Kpi({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        {trend}
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Trend({ today, yesterday }: { today: number; yesterday: number }) {
  if (yesterday <= 0) return today > 0 ? <span className="text-xs font-semibold text-success">novo</span> : null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) return <span className="text-xs font-semibold text-muted">=</span>;
  const up = pct > 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function BarRow({ label, value, max, display, sub }: { label: string; value: number; max: number; display: string; sub?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-ink">{label}</span>
        <span className="shrink-0 font-semibold text-ink tabular-nums">{display}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        {sub && <span className="shrink-0 text-xs text-muted tabular-nums">{sub}</span>}
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; revenue: number; orders: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-semibold text-ink">{new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
      <p className="font-semibold text-brand">{brl(p.revenue)}</p>
      <p className="text-muted">{p.orders} pedido{p.orders === 1 ? "" : "s"}</p>
    </div>
  );
}
