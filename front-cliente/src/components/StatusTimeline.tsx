"use client";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@cabana/shared";
import { shortDate } from "@/lib/format";

// Ordem canônica exibida no tracking (fluxo feliz)
const FLOW: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DISPATCHED",
  "PICKED_UP",
  "IN_ROUTE",
  "DELIVERED",
  "CONFIRMED_BY_CUSTOMER",
];

interface Props {
  current: OrderStatus;
  history: { status: OrderStatus; createdAt: string }[];
}

export function StatusTimeline({ current, history }: Props) {
  if (current === "CANCELLED") {
    return (
      <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
        Pedido cancelado.
      </div>
    );
  }
  const reachedIndex = FLOW.indexOf(current);
  const timeFor = (s: OrderStatus) => history.find((h) => h.status === s)?.createdAt;

  return (
    <ol className="relative ml-2 border-l-2 border-black/10">
      {FLOW.map((s, i) => {
        const done = i <= reachedIndex;
        const isCurrent = i === reachedIndex;
        const at = timeFor(s);
        return (
          <li key={s} className="mb-4 ml-4 last:mb-0">
            <span
              className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ${
                done ? "bg-brand" : "bg-black/15"
              } ${isCurrent ? "ring-4 ring-brand/20" : ""}`}
            />
            <p className={`text-sm ${done ? "font-semibold text-ink" : "text-muted"}`}>
              {ORDER_STATUS_LABEL[s]}
            </p>
            {at && <p className="text-xs text-muted">{shortDate(at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
