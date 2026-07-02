"use client";
import Image from "next/image";
import type { CategoryDTO } from "@cabana/shared";

// Card de destaque da categoria selecionada — muda a foto/nome conforme a
// aba escolhida no header. Dá contexto visual sem duplicar o seletor.
export function CategoryHero({ category, count }: { category: CategoryDTO; count: number }) {
  return (
    <div className="relative mx-4 mb-3 h-32 overflow-hidden rounded-2xl bg-black/5">
      {category.imageUrl && (
        <Image src={category.imageUrl} alt={category.name} fill sizes="480px" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-2xl font-bold text-white">{category.name}</p>
        <p className="text-sm font-medium text-white/85">
          {count} {count === 1 ? "item" : "itens"}
        </p>
      </div>
    </div>
  );
}
