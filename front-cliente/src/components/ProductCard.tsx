"use client";
import Image from "next/image";
import Link from "next/link";
import type { ProductDTO } from "@cabana/shared";
import { brl } from "@/lib/format";

export function ProductCard({ product }: { product: ProductDTO }) {
  const hasPromo = product.promoActive && product.promoPercent;
  return (
    <Link href={`/produto/${product.id}`} className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {hasPromo && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-cream">
            {product.promoPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="font-display text-lg font-bold text-brand">{brl(product.finalPrice)}</span>
          {hasPromo && (
            <span className="text-xs text-muted line-through">{brl(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
