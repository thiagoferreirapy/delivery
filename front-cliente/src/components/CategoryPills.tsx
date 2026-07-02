"use client";
import Image from "next/image";
import type { CategoryDTO } from "@cabana/shared";
import { LayoutGrid, UtensilsCrossed } from "lucide-react";

interface Props {
  categories: CategoryDTO[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

// Pílulas circulares com imagem — scroll horizontal livre (sem snap rígido).
export function CategoryPills({ categories, active, onSelect }: Props) {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-4 py-3">
      <Pill label="Tudo" active={active === null} onClick={() => onSelect(null)} />
      {categories.map((c) => (
        <Pill
          key={c.id}
          label={c.name}
          imageUrl={c.imageUrl}
          active={active === c.id}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  );
}

function Pill({
  label,
  imageUrl,
  active,
  onClick,
}: {
  label: string;
  imageUrl?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1.5"
    >
      <span
        className={`grid h-16 w-16 place-items-center overflow-hidden rounded-full ring-2 transition-colors ${
          active ? "ring-brand" : "ring-black/5"
        }`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={label} width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand/10 text-brand">
            {label === "Tudo" ? (
              <LayoutGrid size={24} strokeWidth={2} />
            ) : (
              <UtensilsCrossed size={22} strokeWidth={2} />
            )}
          </span>
        )}
      </span>
      <span className={`text-xs font-medium ${active ? "text-brand" : "text-muted"}`}>{label}</span>
    </button>
  );
}
