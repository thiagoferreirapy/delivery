"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconList, IconMap, IconHistory, IconUser } from "./icons";

const items = [
  { href: "/", label: "Entregas", Icon: IconList, match: (p: string) => p === "/" },
  { href: "/rota", label: "Rota", Icon: IconMap, match: (p: string) => p.startsWith("/rota") },
  { href: "/historico", label: "Histórico", Icon: IconHistory, match: (p: string) => p.startsWith("/historico") },
  { href: "/perfil", label: "Perfil", Icon: IconUser, match: (p: string) => p.startsWith("/perfil") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur safe-bottom">
      <ul className="mx-auto flex max-w-app items-stretch justify-between px-2">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${active ? "text-brand" : "text-muted"}`}>
                <Icon width={22} height={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
