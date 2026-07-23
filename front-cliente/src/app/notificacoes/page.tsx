"use client";
import { useState } from "react";
import Link from "next/link";
import { TabShell } from "@/components/TabShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { IconReceipt, IconBell, IconBellOff, IconMessage } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useNotificationsStore, type AppNotification } from "@/lib/notifications-store";

function when(at: number): string {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return new Date(at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function extractCode(title: string): string | null {
  const m = title.match(/CL-\d+/i);
  return m ? m[0].toUpperCase() : null;
}

interface OrderGroup {
  key: string;
  code: string;
  orderId: string | null;
  items: AppNotification[]; // mais recentes primeiro
}

// Agrupa notificações por pedido (mantém a ordem: mais recentes no topo).
function groupByOrder(items: AppNotification[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const n of items) {
    const orderId = typeof n.data?.orderId === "string" ? n.data.orderId : null;
    const code = extractCode(n.title);
    const key = orderId ?? code ?? n.id;
    let g = map.get(key);
    if (!g) {
      g = { key, code: code ?? "Pedido", orderId, items: [] };
      map.set(key, g);
    }
    g.items.push(n);
  }
  return [...map.values()].sort((a, b) => (b.items[0]?.at ?? 0) - (a.items[0]?.at ?? 0));
}

export default function NotificationsPage() {
  const { ready } = useRequireAuth();
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const clearKind = useNotificationsStore((s) => s.clearKind);

  if (!ready) return null;

  const conversas = groupByOrder(items.filter((n) => n.kind === "message"));
  const pedidos = groupByOrder(items.filter((n) => n.kind !== "message"));

  return (
    <TabShell>
      <PageHeader title="Notificações" />

      {/* Atalho para os pedidos */}
      <div className="px-4 pt-3">
        <Link href="/pedidos" className="card flex items-center gap-3 p-3 transition active:scale-[0.99] hover:shadow-cardHover">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <IconReceipt width={20} height={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Meus pedidos</p>
            <p className="text-xs text-muted">Acompanhe e veja o histórico</p>
          </div>
          <span className="text-muted">›</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<IconBellOff width={30} height={30} />} title="Nenhuma notificação" subtitle="Avisamos aqui sobre o andamento dos seus pedidos." />
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
          <Section
            title="Pedidos"
            icon={<IconBell width={16} height={16} />}
            groups={pedidos}
            emptyText="Sem atualizações de status por enquanto."
            onClear={() => clearKind("order")}
          />
          <Section
            title="Conversas"
            icon={<IconMessage width={16} height={16} />}
            groups={conversas}
            emptyText="Nenhuma mensagem da loja."
            onClear={() => clearKind("message")}
          />
        </div>
      )}
    </TabShell>
  );
}

function Section({
  title,
  icon,
  groups,
  emptyText,
  onClear,
}: {
  title: string;
  icon: React.ReactNode;
  groups: OrderGroup[];
  emptyText: string;
  onClear: () => void;
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          {title}
          {total > 0 && (
            <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-bold text-muted">{total}</span>
          )}
        </h2>
        {total > 0 && (
          <button onClick={onClear} className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-danger">
            Limpar
          </button>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-xs text-muted">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <GroupCard key={g.key} group={g} icon={icon} />
          ))}
        </div>
      )}
    </section>
  );
}

function GroupCard({ group, icon }: { group: OrderGroup; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const markRead = useNotificationsStore((s) => s.markRead);
  const latest = group.items[0];
  const count = group.items.length;
  const hasUnread = group.items.some((i) => !i.read);

  function toggle() {
    const next = !open;
    setOpen(next);
    // Ao abrir um grupo com novidade, marca essas notificações como vistas.
    if (next && hasUnread) markRead(group.items.map((i) => i.id));
  }

  return (
    <div className={`card overflow-hidden ${hasUnread ? "ring-1 ring-danger/30" : ""}`}>
      <button onClick={toggle} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{group.code}</p>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                hasUnread ? "bg-danger text-white" : "bg-black/[0.06] text-muted"
              }`}
            >
              {count}
            </span>
          </div>
          {!open && latest && <p className="truncate text-sm text-muted">{latest.body || latest.title}</p>}
          <p className="mt-0.5 text-xs text-muted">{latest ? when(latest.at) : ""}</p>
        </div>
        <span className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {open && (
        <div className="divide-y divide-black/5 border-t border-black/5">
          {group.items.map((n) => (
            <div key={n.id} className="px-3 py-2.5">
              <p className="text-sm text-ink">{n.body || n.title}</p>
              <p className="mt-0.5 text-xs text-muted">{when(n.at)}</p>
            </div>
          ))}
          {group.orderId && (
            <Link href={`/pedido/${group.orderId}`} className="block px-3 py-2.5 text-sm font-semibold text-brand">
              Ver pedido ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
