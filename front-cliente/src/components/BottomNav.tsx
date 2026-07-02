"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { IconHome, IconSearch, IconCart, IconReceipt, IconUser } from "./icons";

const items = [
  { href: "/", label: "Início", Icon: IconHome, match: (p: string) => p === "/" },
  { href: "/buscar", label: "Buscar", Icon: IconSearch, match: (p: string) => p.startsWith("/buscar") },
  { href: "/carrinho", label: "Carrinho", Icon: IconCart, match: (p: string) => p.startsWith("/carrinho"), badge: true },
  { href: "/pedidos", label: "Pedidos", Icon: IconReceipt, match: (p: string) => p.startsWith("/pedido") },
  { href: "/perfil", label: "Perfil", Icon: IconUser, match: (p: string) => p.startsWith("/perfil") },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur safe-bottom md:hidden">
      <ul className="mx-auto flex max-w-app items-stretch justify-between px-2">
        {items.map(({ href, label, Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon width={22} height={22} />
                  {badge && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                      {count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
