import { TabShell } from "@/components/TabShell";
import { PageHeader } from "@/components/ui";
import { OrderListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <TabShell>
      <PageHeader title="Meus pedidos" />
      <OrderListSkeleton count={4} />
    </TabShell>
  );
}
