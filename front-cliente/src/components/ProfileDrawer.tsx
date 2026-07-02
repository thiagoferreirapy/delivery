"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ReceiptText,
  MapPin,
  Search,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket } from "@/lib/socket";

// Menu lateral (drawer) que desliza da esquerda ao tocar no avatar do header.
export function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  function go(href: string) {
    onClose();
    router.push(href);
  }
  function logout() {
    clear();
    disconnectSocket();
    onClose();
    router.replace("/login");
  }

  const items = [
    { label: "Cardápio", icon: UtensilsCrossed, href: "/" },
    { label: "Buscar", icon: Search, href: "/buscar" },
    { label: "Meus pedidos", icon: ReceiptText, href: "/pedidos" },
    { label: "Meus endereços", icon: MapPin, href: "/perfil" },
  ];

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* painel */}
      <aside
        className={`absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-cream shadow-2xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* cabeçalho do perfil */}
        <div className="safe-top bg-white px-5 pb-5 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-ink">{user?.name ?? "Visitante"}</p>
              <Link
                href={user ? "/perfil" : "/login"}
                onClick={onClose}
                className="mt-0.5 inline-flex items-center gap-0.5 text-sm font-medium text-brand"
              >
                {user ? "Editar minhas informações" : "Entrar ou cadastrar"}
                <ChevronRight size={16} strokeWidth={2} />
              </Link>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        </div>

        {/* menu */}
        <nav className="flex flex-1 flex-col overflow-y-auto py-2">
          {items.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => go(href)}
              className="flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="text-[15px] font-medium text-ink">{label}</span>
            </button>
          ))}

          {user && (
            <>
              <div className="mx-5 my-2 h-px bg-black/5" />
              <button
                onClick={logout}
                className="flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-danger/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                  <LogOut size={18} strokeWidth={2} />
                </span>
                <span className="text-[15px] font-medium text-danger">Sair</span>
              </button>
            </>
          )}
        </nav>

        <footer className="safe-bottom px-5 py-4 text-xs text-muted">
          © {new Date().getFullYear()} Cabana Lanches
        </footer>
      </aside>
    </div>
  );
}
