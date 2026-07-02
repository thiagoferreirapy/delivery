"use client";
import { useEffect, useRef, useState } from "react";
import type { CategoryDTO } from "@cabana/shared";
import { IconBell, IconCamera, IconMapPin, IconSearch } from "./icons";

interface Props {
  userInitial: string;
  address?: string | null;
  onAddressClick?: () => void;
  search: string;
  onSearch: (v: string) => void;
  categories?: CategoryDTO[];
  activeCategory?: string | null; // null = "Tudo"
  onCategory?: (id: string | null) => void;
  onBell?: () => void;
}

export function StickyHeader({
  userInitial,
  address,
  onAddressClick,
  search,
  onSearch,
  categories = [],
  activeCategory = null,
  onCategory,
  onBell,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setCollapsed(window.scrollY > 120);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-brand text-cream shadow-soft safe-top">
      <div className="mx-auto max-w-app px-4 pt-3">
        {/* Linha 1 — sempre visível */}
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/20 font-semibold">
            {userInitial}
          </div>
          <label className="flex flex-1 items-center gap-2 rounded-2xl bg-cream px-3 py-2 text-ink">
            <IconSearch className="text-muted" width={18} height={18} />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar na Cabana…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
            <button type="button" aria-label="Escanear" className="text-muted">
              <IconCamera width={18} height={18} />
            </button>
          </label>
          <button
            type="button"
            aria-label="Notificações"
            onClick={onBell}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/20"
          >
            <IconBell width={18} height={18} />
          </button>
        </div>

        {/* Linhas 2 e 3 — recolhem no scroll */}
        <div
          className={`grid transition-all duration-200 ease-out ${
            collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            {/* Linha 2 — endereço */}
            <button
              type="button"
              onClick={onAddressClick}
              className="mt-2 flex w-full items-center gap-1.5 text-left text-sm text-cream/90"
            >
              <IconMapPin width={16} height={16} />
              <span className="truncate">
                Entregar em:{" "}
                <span className="font-semibold underline decoration-cream/40 underline-offset-2">
                  {address ?? "escolher endereço"}
                </span>
              </span>
            </button>

            {/* Linha 3 — categorias */}
            {(onCategory || categories.length > 0) && (
              <nav className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-3">
                <CategoryTab
                  label="Tudo"
                  active={activeCategory === null}
                  onClick={() => onCategory?.(null)}
                />
                {categories.map((c) => (
                  <CategoryTab
                    key={c.id}
                    label={c.name}
                    active={activeCategory === c.id}
                    onClick={() => onCategory?.(c.id)}
                  />
                ))}
              </nav>
            )}
          </div>
        </div>
        {/* padding inferior quando colapsado */}
        <div className={collapsed ? "pb-3" : ""} />
      </div>
    </header>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-cream text-brand" : "bg-cream/15 text-cream hover:bg-cream/25"
      }`}
    >
      {label}
    </button>
  );
}
