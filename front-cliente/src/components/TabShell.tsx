"use client";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

// Envolve as telas de aba (com bottom nav) e garante respiro para o rodapé fixo.
export function TabShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-app pb-24 md:pb-6">
      {children}
      <BottomNav />
    </div>
  );
}
