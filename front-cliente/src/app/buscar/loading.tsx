import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto min-h-dvh max-w-app bg-cream">
      <div className="safe-top flex items-center gap-2 border-b border-black/5 bg-white px-2 py-2">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
