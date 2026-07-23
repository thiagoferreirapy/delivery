"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BRAND = "#6E1423";
function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:32px;height:32px;border-radius:9999px 9999px 9999px 2px;background:#fff;border:2px solid ${BRAND};box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:16px">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  });
}

// Mini-mapa com um pino arrastável para o cliente marcar o local exato.
// Arrastar OU clicar no mapa move o pino e reporta a coordenada.
export function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const c = value ?? { lat: -23.55, lng: -46.63 };
    const map = L.map(ref.current, { attributionControl: false }).setView([c.lat, c.lng], value ? 16 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    const m = L.marker([c.lat, c.lng], { draggable: true, icon: pinIcon() }).addTo(map);
    m.on("dragend", () => {
      const ll = m.getLatLng();
      onChangeRef.current({ lat: ll.lat, lng: ll.lng });
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      m.setLatLng(e.latlng);
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    markerRef.current = m;
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move o pino quando o valor muda de fora (ex.: após "buscar no mapa")
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !value) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], 16, { animate: true });
  }, [value?.lat, value?.lng]);

  return <div ref={ref} className="h-44 w-full overflow-hidden rounded-xl border border-black/10" style={{ zIndex: 0 }} />;
}
