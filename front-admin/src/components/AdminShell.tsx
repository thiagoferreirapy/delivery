"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { navForRole, ROLE_LABEL } from "@/lib/rbac";
import { disconnectSocket } from "@/lib/socket";
import { Icon } from "./icons";
import type { EmployeeRole } from "@cabana/shared";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const [open, setOpen] = useState(false);
  const nav = navForRole(user?.role as EmployeeRole | undefined);

  function logout() {
    clear();
    disconnectSocket();
    router.replace("/login");
  }

  const NavList = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/pedidos" && pathname.startsWith(item.href));
        const IconCmp = (Icon as any)[item.icon] ?? Icon.box;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-brand text-cream" : "text-ink/80 hover:bg-black/5"
            }`}
          >
            <IconCmp width={18} height={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-2">
        <p className="font-display text-xl font-bold text-brand">Cabana</p>
        <p className="text-xs text-muted">Painel do restaurante</p>
      </div>
      {NavList}
      <div className="mt-auto border-t border-black/5 pt-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
          <p className="text-xs text-muted">{user?.role ? ROLE_LABEL[user.role] : ""}</p>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/5">
          <Icon.logout width={18} height={18} /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white p-4 md:block">
        {SidebarInner}
      </aside>

      {/* Topbar mobile */}
      <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-black/5">
          <Icon.menu />
        </button>
        <span className="font-display text-lg font-bold text-brand">Cabana</span>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            {SidebarInner}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
    </div>
  );
}
