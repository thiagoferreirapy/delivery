import { TabShell } from "@/components/TabShell";
import { Skeleton, ProductGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <TabShell>
      <div className="px-4 py-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
      <div className="px-4">
        <ProductGridSkeleton count={8} />
      </div>
    </TabShell>
  );
}
