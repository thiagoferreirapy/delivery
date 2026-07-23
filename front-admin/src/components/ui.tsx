"use client";
import type { ReactNode } from "react";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@cabana/shared";
import { Icon } from "./icons";

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  CONFIRMED: "bg-brand/10 text-brand",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-blue-100 text-blue-700",
  IN_ROUTE: "bg-indigo-100 text-indigo-700",
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

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
    </div>
  );
}

export function EmptyState({ icon, emoji, title, subtitle }: { icon?: ReactNode; emoji?: string; title: string; subtitle?: string }) {
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

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-cream p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
            <Icon.x />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 ${checked ? "text-success" : "text-muted"}`}
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-success" : "bg-black/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
