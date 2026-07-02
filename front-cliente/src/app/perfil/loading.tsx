import { TabShell } from "@/components/TabShell";
import { PageHeader } from "@/components/ui";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <TabShell>
      <PageHeader title="Perfil" />
      <div className="flex flex-col gap-4 p-4">
        <div className="card flex items-center gap-3 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <Skeleton className="h-5 w-28" />
        <div className="card p-3">
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="card p-3">
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </TabShell>
  );
}
