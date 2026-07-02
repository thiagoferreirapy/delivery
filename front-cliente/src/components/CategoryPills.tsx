"use client";
import Image from "next/image";
import type { CategoryDTO } from "@cabana/shared";

interface Props {
  categories: CategoryDTO[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

// Pílulas circulares com imagem — scroll horizontal com snap (mobile-first)
export function CategoryPills({ categories, active, onSelect }: Props) {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-3 snap-x snap-mandatory">
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
      className="flex shrink-0 snap-start flex-col items-center gap-1.5"
    >
      <span
        className={`grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 transition-colors ${
          active ? "border-brand" : "border-transparent"
        }`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={label} width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand/10 text-brand">🍽️</span>
        )}
      </span>
      <span className={`text-xs font-medium ${active ? "text-brand" : "text-muted"}`}>{label}</span>
    </button>
  );
}
