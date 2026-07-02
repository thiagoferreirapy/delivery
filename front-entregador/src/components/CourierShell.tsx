"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDeliveries } from "@/lib/queries";
import { useAuthStore } from "@/lib/auth-store";
import { useLocationTracking } from "@/lib/use-location-tracking";
import { BottomNav } from "./BottomNav";

// Runner global: envia a localização enquanto houver entrega EM ROTA.
function TrackingRunner() {
  const { data: deliveries = [] } = useDeliveries();
  const inRoute = deliveries.find((d) => d.status === "IN_ROUTE");
  const target =
    inRoute && inRoute.address.lat != null && inRoute.address.lng != null
      ? { lat: inRoute.address.lat, lng: inRoute.address.lng }
      : null;
  useLocationTracking(!!target, target);
  return null;
}

export function CourierShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { data: deliveries = [] } = useDeliveries();
  const active = deliveries.filter((d) => ["DISPATCHED", "PICKED_UP", "IN_ROUTE"].includes(d.status)).length;
  const onRoute = deliveries.some((d) => d.status === "IN_ROUTE");

  const [collapsed, setCollapsed] = useState(false);
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setCollapsed(window.scrollY > 100);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-24">
      <TrackingRunner />

      {/* Header sticky com 2 estados (expandido/colapsado) */}
      <header className="sticky top-0 z-40 bg-brand text-cream shadow-soft safe-top">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream/20 text-lg">🛵</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user?.name ?? "Entregador"}</p>
              <span className="inline-flex items-center gap-1 text-xs text-cream/85">
                <span className={`h-2 w-2 rounded-full ${onRoute ? "bg-emerald-300 animate-pulse" : "bg-cream/60"}`} />
                {onRoute ? "Em rota" : "Disponível"}
              </span>
            </div>
            <span className="rounded-full bg-cream/20 px-3 py-1 text-sm font-semibold">{active} ativas</span>
          </div>

          <div className={`grid transition-all duration-200 ease-out ${collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
            <div className="overflow-hidden">
              <p className="py-2 text-sm text-cream/90">
                {active === 0 ? "Nenhuma entrega no momento." : `Você tem ${active} entrega(s) para hoje. Bom trabalho!`}
              </p>
            </div>
          </div>
          <div className="pb-3" />
        </div>
      </header>

      {children}
      <BottomNav />
    </div>
  );
}
