import { PageHeader } from "@/components/ui";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto min-h-dvh max-w-app pb-32">
      <PageHeader title="Finalizar pedido" back="/carrinho" />
      <div className="flex flex-col gap-5 p-4">
        <Skeleton className="h-5 w-40" />
        <div className="card p-3">
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
