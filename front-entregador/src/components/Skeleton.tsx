export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/5 ${className}`} />;
}

export function DeliveryCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mb-1 flex items-start gap-1.5">
        <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mb-3 mt-2 flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
    </div>
  );
}

export function DeliveryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DeliveryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HistoryRowSkeleton() {
  return (
    <div className="card flex items-center justify-between p-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}

export function HistoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <HistoryRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function DeliveryDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Cliente + endereço */}
      <div className="card space-y-2 p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <div className="flex items-start gap-1.5 pt-1">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      {/* Itens */}
      <div className="card space-y-2 p-4">
        <Skeleton className="h-4 w-16" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="border-t border-black/5 pt-2">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      {/* Ações */}
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
