"use client";
import type { InputHTMLAttributes, ReactNode } from "react";

// Input com ícone à esquerda, no estilo dos campos do app.
export function IconInput({ icon, ...props }: { icon: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white px-3.5 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      <span className="shrink-0 text-muted">{icon}</span>
      <input {...props} className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-muted/60" />
    </div>
  );
}
