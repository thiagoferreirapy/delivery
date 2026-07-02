import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/5 ${className}`} />;
}

/* Dashboard: 4 KPI cards + chart area (same shape as real content). */
export function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <Skeleton className="mb-3 h-5 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="card p-5">
          <Skeleton className="mb-3 h-5 w-40" />
          <div className="flex flex-col divide-y divide-black/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-2.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Kitchen: 3 kanban columns, ~2 card skeletons each (same card height). */
export function KitchenSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, col) => (
        <section key={col} className="rounded-2xl border-t-4 border-t-black/10 bg-black/[0.02] p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <article key={i} className="card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="mb-3 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* Orders: table rows. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-black/5 bg-black/[0.02] px-4 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-black/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* CRUD lists: ~5 rows at the same height as real rows. */
export function ListSkeleton({ rows = 5, leading }: { rows?: number; leading?: ReactNode }) {
  return (
    <div className="card divide-y divide-black/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {leading ?? <Skeleton className="h-10 w-10 rounded-lg" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* Dispatch: card skeletons in the same grid. */
export function DispatchSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <article key={i} className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="mb-3 h-3 w-32" />
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="mb-3 h-10 w-full rounded-xl" />
          <Skeleton className="mb-3 h-14 w-14 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </article>
      ))}
    </div>
  );
}
