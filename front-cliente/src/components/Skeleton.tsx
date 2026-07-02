import type { HTMLAttributes } from "react";

// Skeleton base: bloco cinza com animação de pulse.
export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded bg-black/5 ${className}`} {...props} />;
}

// Card de produto: thumb quadrado + 2 linhas de texto (mesmo shape do ProductCard).
export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-auto h-5 w-1/2" />
      </div>
    </div>
  );
}

// Grid de produtos: mesma grid da Home / Buscar, com N cards.
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Detalhe do produto: imagem grande quadrada + linhas de texto.
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-app pb-28">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// Lista de pedidos: N cards na mesma altura dos cards reais.
export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-3">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

// Tracking: skeleton de timeline / cards.
export function OrderTrackingSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-app pb-10">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="card flex flex-col gap-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="card flex flex-col gap-3 p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
