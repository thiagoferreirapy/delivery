"use client";
import { useEffect } from "react";
import Link from "next/link";
import { TabShell } from "@/components/TabShell";
import { PageHeader, EmptyState } from "@/components/ui";
import { IconReceipt, IconBell, IconBellOff } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useNotificationsStore } from "@/lib/notifications-store";

function when(at: number): string {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return new Date(at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function NotificationsPage() {
  const { ready } = useRequireAuth();
  const items = useNotificationsStore((s) => s.items);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  if (!ready) return null;

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

      <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-ink">Avisos</h2>

      {items.length === 0 ? (
        <EmptyState icon={<IconBellOff width={30} height={30} />} title="Nenhuma notificação" subtitle="Avisamos aqui sobre o andamento dos seus pedidos." />
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {items.map((n) => (
            <div key={n.id} className="card flex gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <IconBell width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="mt-0.5 text-xs text-muted">{when(n.at)}</p>
              </div>
            </div>
          ))}
          <button onClick={clear} className="mb-2 self-start text-sm text-muted underline">
            Limpar notificações
          </button>
        </div>
      )}
    </TabShell>
  );
}
