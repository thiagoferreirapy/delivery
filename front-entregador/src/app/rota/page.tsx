"use client";
import Link from "next/link";
import { CourierShell } from "@/components/CourierShell";
import { LiveMap } from "@/components/LiveMap";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { useDeliveries } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLocationStore } from "@/lib/location-store";

export default function RoutePage() {
  const { ready } = useRequireAuth();
  const { data: deliveries = [], isLoading } = useDeliveries();
  const { lat, lng, usingGps } = useLocationStore();

  if (!ready) return null;

  const inRoute = deliveries.filter((d) => d.status === "IN_ROUTE");
  const first = inRoute[0];
  const me = lat != null && lng != null ? { lat, lng } : null;
  const dest = first && first.address.lat != null && first.address.lng != null
    ? { lat: first.address.lat, lng: first.address.lng }
    : null;

  return (
    <CourierShell>
      <div className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Rota</h2>
        {isLoading ? (
          <Spinner />
        ) : inRoute.length === 0 ? (
          <EmptyState emoji="🗺️" title="Nenhuma rota ativa" subtitle="Inicie uma entrega para acompanhar no mapa." />
        ) : (
          <>
            <LiveMap me={me} dest={dest} height="h-64" />
            <p className="mt-2 text-center text-xs text-muted">
              {usingGps ? "Enviando sua localização (GPS) em tempo real" : "Localização simulada (sem GPS) — o cliente vê o pino se mover"}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {inRoute.map((d) => (
                <Link key={d.id} href={`/entrega/${d.id}`} className="card flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold text-ink">{d.code}</p>
                    <p className="text-xs text-muted">{d.address.street}, {d.address.number} — {d.address.neighborhood}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </CourierShell>
  );
}
