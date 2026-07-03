"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@cabana/shared";
import { IconChevronLeft, IconStar } from "./icons";

// Badge de status com cor por grupo
const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  CONFIRMED: "bg-brand/10 text-brand",
  PREPARING: "bg-brand/10 text-brand",
  READY: "bg-brand/10 text-brand",
  DISPATCHED: "bg-brand/10 text-brand",
  PICKED_UP: "bg-brand/10 text-brand",
  IN_ROUTE: "bg-brand/10 text-brand",
  DELIVERED: "bg-success/15 text-success",
  CONFIRMED_BY_CUSTOMER: "bg-success/15 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PageHeader({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-black/5 bg-cream/95 px-3 py-3 backdrop-blur safe-top">
      <Link href={back} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5">
        <IconChevronLeft />
      </Link>
      <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
    </header>
  );
}

export function Stars({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={n <= value ? "text-warning" : "text-black/20"}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <IconStar width={size} height={size} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ emoji, icon, title, subtitle }: { emoji?: string; icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icon ? (
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">{icon}</span>
      ) : (
        <span className="text-5xl">{emoji}</span>
      )}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
    </div>
  );
}
