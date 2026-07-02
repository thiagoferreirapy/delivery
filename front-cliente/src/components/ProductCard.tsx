"use client";
import Image from "next/image";
import Link from "next/link";
import type { ProductDTO } from "@cabana/shared";
import { brl } from "@/lib/format";

// Card de produto — feel iFood: branco, arejado, sombra quase invisível,
// nome semibold quase-preto, descrição cinza, preço em destaque (promo em vinho).
export function ProductCard({ product }: { product: ProductDTO }) {
  const hasPromo = product.promoActive && product.promoPercent;
  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 ease-out hover:shadow-cardHover active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/[0.03]">
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
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
            -{product.promoPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink md:text-[15px]">{product.name}</h3>
        {(product.description || product.ingredients) && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500">
            {product.description ?? product.ingredients}
          </p>
        )}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`text-[15px] font-semibold tabular-nums ${hasPromo ? "text-brand" : "text-ink"}`}>
            {brl(product.finalPrice)}
          </span>
          {hasPromo && (
            <span className="text-xs text-neutral-400 line-through">{brl(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
