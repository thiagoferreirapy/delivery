"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CourierShell } from "@/components/CourierShell";
import { LiveMap } from "@/components/LiveMap";
import { OrderChat } from "@/components/OrderChat";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { IconMessage, IconCheck, IconMap, IconNavigation } from "@/components/icons";
import type { OrderDTO } from "@cabana/shared";

// Abre o app de mapa (Google Maps) com rota até o endereço da entrega.
// Usa coordenadas se houver; senão, o texto do endereço. A origem é a
// localização atual do dispositivo (o Google Maps resolve sozinho).
function mapsNavUrl(o: OrderDTO): string {
  const a = o.address;
  const dest =
    a.lat != null && a.lng != null
      ? `${a.lat},${a.lng}`
      : encodeURIComponent(`${a.street}, ${a.number} - ${a.neighborhood}, ${a.city} - ${a.state}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}
import { useDeliveries, useOrderMessages } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLocationStore } from "@/lib/location-store";

export default function RoutePage() {
  const { ready } = useRequireAuth();
  const params = useSearchParams();
  const orderParam = params.get("order");
  const { data: deliveries = [], isLoading } = useDeliveries();
  const { lat, lng, usingGps } = useLocationStore();
  const [chat, setChat] = useState(false);

  const inRoute = deliveries.filter((d) => d.status === "IN_ROUTE");
  const selected = inRoute.find((d) => d.id === orderParam) ?? inRoute[0];
  const { data: msgData } = useOrderMessages(selected?.id ?? "");
  const unread = msgData?.messages.filter((m) => m.senderType === "CUSTOMER" && !m.readAt).length ?? 0;

  if (!ready) return null;

  const me = lat != null && lng != null ? { lat, lng } : null;
  const dest =
    selected && selected.address.lat != null && selected.address.lng != null
      ? { lat: selected.address.lat, lng: selected.address.lng }
      : null;

  return (
    <CourierShell>
      <div className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Rota</h2>
        {isLoading ? (
          <Spinner />
        ) : !selected ? (
          <EmptyState icon={<IconMap width={30} height={30} />} title="Nenhuma rota ativa" subtitle="Inicie uma entrega para acompanhar no mapa." />
        ) : (
          <>
            <LiveMap me={me} dest={dest} height="h-64" />
            <p className="mt-2 text-center text-xs text-muted">
              {usingGps ? "Enviando sua localização (GPS) em tempo real" : "Localização simulada (sem GPS). O cliente vê o pino se mover"}
            </p>

            {/* Pedido selecionado */}
            <div className="card mt-4 p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink">{selected.code}</p>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {selected.address.street}, {selected.address.number} - {selected.address.neighborhood}
              </p>
              <p className="mt-0.5 text-xs text-muted">{selected.customer.name}</p>

              {/* Navegar no app de mapa (Google Maps) */}
              <a
                href={mapsNavUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-cream transition active:scale-[0.98]"
              >
                <IconNavigation width={16} height={16} /> Navegar no mapa
              </a>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setChat(true)}
                  className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand/30 py-2 text-sm font-semibold text-brand transition active:scale-[0.98]"
                >
                  <IconMessage width={16} height={16} /> Cliente
                  {unread > 0 && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                <Link href={`/entrega/${selected.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2 text-sm font-semibold text-ink transition active:scale-[0.98]">
                  <IconCheck width={16} height={16} /> Entrega
                </Link>
              </div>
            </div>

            {/* Outras entregas em rota (se houver mais de uma) */}
            {inRoute.length > 1 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted">Outras entregas em rota</p>
                <div className="flex flex-col gap-2">
                  {inRoute
                    .filter((d) => d.id !== selected.id)
                    .map((d) => (
                      <Link
                        key={d.id}
                        href={`/rota?order=${d.id}`}
                        className="card flex items-center justify-between p-3 transition active:scale-[0.99] hover:shadow-cardHover"
                      >
                        <div>
                          <p className="font-semibold text-ink">{d.code}</p>
                          <p className="text-xs text-muted">{d.address.street}, {d.address.number} - {d.address.neighborhood}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {chat && selected && <OrderChat orderId={selected.id} customerName={selected.customer.name} onClose={() => setChat(false)} />}
    </CourierShell>
  );
}
