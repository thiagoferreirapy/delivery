"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CategoryDTO } from "@cabana/shared";
import { IconBell, IconMapPin, IconSearch } from "./icons";

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
  onAvatar?: () => void;
  notifCount?: number;
  onSearchFocus?: () => void;
}

// distância de scroll (px) para colapsar totalmente endereço + categorias
const COLLAPSE = 96;

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
  onAvatar,
  notifCount = 0,
  onSearchFocus,
}: Props) {
  const collapseRef = useRef<HTMLDivElement>(null);
  const [fullH, setFullH] = useState(0);
  const [progress, setProgress] = useState(0); // 0 = expandido, 1 = colapsado

  // mede a altura natural da região (re-mede quando categorias carregam / resize)
  useEffect(() => {
    const el = collapseRef.current;
    if (!el) return;
    const measure = () => setFullH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // colapso ligado ao progresso do scroll (suave, acompanha o dedo)
  useEffect(() => {
    let raf = false;
    const onScroll = () => {
      if (raf) return;
      raf = true;
      requestAnimationFrame(() => {
        raf = false;
        setProgress(Math.min(1, Math.max(0, window.scrollY / COLLAPSE)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const eased = 1 - Math.pow(1 - progress, 2); // ease-out
  const collapseStyle: CSSProperties =
    progress <= 0
      ? { transformOrigin: "top" }
      : {
          height: Math.max(0, fullH * (1 - eased)),
          opacity: Math.max(0, 1 - progress * 1.3),
          transform: `translateY(${-6 * eased}px)`,
          transformOrigin: "top",
        };

  return (
    <header className="sticky top-0 z-40 bg-brand text-cream shadow-soft safe-top">
      <div className="mx-auto max-w-app px-4 pb-2 pt-3">
        {/* Linha 1 — sempre visível */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAvatar}
            aria-label="Abrir menu do perfil"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/20 font-semibold transition active:scale-95"
          >
            {userInitial}
          </button>
          <label className="flex flex-1 items-center gap-2 rounded-2xl bg-cream px-3 py-2 text-ink">
            <IconSearch className="text-muted" width={18} height={18} />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={onSearchFocus}
              onClick={onSearchFocus}
              readOnly={!!onSearchFocus}
              placeholder="Buscar na Cabana…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
          </label>
          <button
            type="button"
            aria-label="Notificações"
            onClick={onBell}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/20"
          >
            <IconBell width={18} height={18} />
            {notifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cream px-1 text-[10px] font-bold text-brand">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
        </div>

        {/* Linhas 2 e 3 — recolhem suavemente conforme o scroll */}
        <div ref={collapseRef} style={collapseStyle} className="overflow-hidden">
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
            <nav className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
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
