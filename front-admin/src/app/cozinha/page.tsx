"use client";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type OrderDTO, type OrderStatus } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle } from "@/components/ui";
import { KitchenSkeleton } from "@/components/Skeleton";
import { useKitchenOrders, useKitchenAction } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { getSocket } from "@/lib/socket";
import { timeAgo } from "@/lib/format";

const COLUMNS: { status: OrderStatus; title: string; accent: string }[] = [
  { status: "CONFIRMED", title: "Recebidos", accent: "border-t-brand" },
  { status: "PREPARING", title: "Em preparo", accent: "border-t-amber-500" },
  { status: "READY", title: "Prontos", accent: "border-t-emerald-500" },
];

export default function KitchenPage() {
  const { ready } = useRequireRole(["ADMIN", "KITCHEN"]);
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useKitchenOrders();
  const action = useKitchenAction();
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ["kitchen"] });
    const onNew = () => {
      refresh();
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.08;
        o.start();
        o.stop(ctx.currentTime + 0.18);
      } catch {}
    };
    socket.on(SOCKET_EVENTS.KITCHEN_NEW, onNew);
    socket.on(SOCKET_EVENTS.KITCHEN_UPDATE, refresh);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.KITCHEN_NEW, onNew);
      socket.off(SOCKET_EVENTS.KITCHEN_UPDATE, refresh);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
    };
  }, [ready, qc]);

  if (!ready) return null;

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);

  return (
    <AdminShell>
      <PageTitle title="Painel da Cozinha" subtitle="Atualiza em tempo real" />
      {isLoading ? (
        <KitchenSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = byStatus(col.status);
            return (
              <section key={col.status} className={`rounded-2xl border-t-4 bg-black/[0.02] p-3 ${col.accent}`}>
                <h2 className="mb-3 flex items-center justify-between px-1 font-semibold text-ink">
                  {col.title}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-muted">{list.length}</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {list.map((o) => (
                    <KitchenCard key={o.id} order={o} onAction={(a) => action.mutate({ id: o.id, action: a })} busy={action.isPending} />
                  ))}
                  {list.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted">Vazio</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function KitchenCard({ order, onAction, busy }: { order: OrderDTO; onAction: (a: "start" | "finish") => void; busy: boolean }) {
  return (
    <article className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-ink">{order.code}</span>
        <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
      </div>
      <ul className="mb-3 space-y-1 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-2">
            <span className="text-ink">
              <span className="font-semibold text-brand">{it.quantity}×</span> {it.name}
            </span>
          </li>
        ))}
      </ul>
      {order.items.some((i) => i.notes) && (
        <div className="mb-3 rounded-lg bg-warning/10 px-2 py-1 text-xs text-warning">
          {order.items.filter((i) => i.notes).map((i) => `${i.name}: ${i.notes}`).join(" · ")}
        </div>
      )}
      {order.notes && <p className="mb-3 text-xs text-muted">Obs: {order.notes}</p>}
      {order.status === "CONFIRMED" && (
        <button onClick={() => onAction("start")} disabled={busy} className="btn-primary w-full text-sm">
          {busy && <Loader2 className="animate-spin" width={16} height={16} />}
          Iniciar preparo
        </button>
      )}
      {order.status === "PREPARING" && (
        <button onClick={() => onAction("finish")} disabled={busy} className="btn-primary w-full bg-emerald-600 text-sm hover:bg-emerald-700">
          {busy && <Loader2 className="animate-spin" width={16} height={16} />}
          Finalizar preparo
        </button>
      )}
      {order.status === "READY" && <p className="text-center text-xs font-semibold text-emerald-600">Aguardando expedição</p>}
    </article>
  );
}
