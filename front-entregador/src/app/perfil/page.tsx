"use client";
import { useRouter } from "next/navigation";
import { CourierShell } from "@/components/CourierShell";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket } from "@/lib/socket";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useDeliveries } from "@/lib/queries";
import { IconLogout } from "@/components/icons";

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { data: done = [] } = useDeliveries(true);

  if (!ready) return null;

  function logout() {
    clear();
    disconnectSocket();
    router.replace("/login");
  }

  return (
    <CourierShell>
      <div className="flex flex-col gap-4 p-4">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-2xl">🛵</span>
          <div>
            <p className="font-display text-lg font-bold text-ink">{user?.name}</p>
            <p className="text-sm text-muted">{user?.phone}</p>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Entregas concluídas</p>
          <p className="font-display text-3xl font-bold text-brand">{done.length}</p>
        </div>
        <button onClick={logout} className="btn-ghost w-full text-danger">
          <IconLogout width={18} height={18} /> Sair
        </button>
      </div>
    </CourierShell>
  );
}
