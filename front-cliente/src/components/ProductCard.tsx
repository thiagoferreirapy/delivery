"use client";
import Image from "next/image";
import Link from "next/link";
import type { ProductDTO } from "@cabana/shared";
import { brl } from "@/lib/format";

// Card estilo Mercado Livre mobile: fonte única (Montserrat), hierarquia por
// peso/tamanho, preço escuro e leve, desconto em verde, visual arejado.
export function ProductCard({ product }: { product: ProductDTO }) {
  const hasPromo = product.promoActive && product.promoPercent;
  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] transition-shadow duration-200 hover:shadow-card"
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
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-normal leading-snug text-ink/70">
          {product.name}
        </h3>

        <div className="mt-2">
          {hasPromo && (
            <span className="block text-[11px] leading-none text-muted line-through">
              {brl(product.price)}
            </span>
          )}
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[17px] font-semibold tracking-tight text-ink tabular-nums">
              {brl(product.finalPrice)}
            </span>
            {hasPromo && (
              <span className="text-[12px] font-semibold text-success">
                {product.promoPercent}% OFF
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
