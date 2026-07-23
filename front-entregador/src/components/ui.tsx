"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@cabana/shared";
import { IconChevronLeft } from "./icons";

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  CONFIRMED: "bg-brand/10 text-brand",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-indigo-100 text-indigo-700",
  IN_ROUTE: "bg-brand/10 text-brand",
  DELIVERED: "bg-success/15 text-success",
  CONFIRMED_BY_CUSTOMER: "bg-success/15 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[status]}`}>
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

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
    </div>
  );
}

export function EmptyState({
  icon,
  emoji,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icon ? (
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">{icon}</span>
      ) : emoji ? (
        <span className="text-5xl">{emoji}</span>
      ) : null}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
