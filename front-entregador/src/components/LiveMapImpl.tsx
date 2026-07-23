"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
}

const BRAND = "#6E1423";

// Ícone HTML (divIcon) — evita o problema dos assets padrão do Leaflet no bundler.
function courierIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;background:${BRAND};color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:18px">🛵</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
function destIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px 9999px 9999px 2px;background:#fff;border:2px solid ${BRAND};transform:rotate(0deg);box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:15px">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

// Mapa real (Leaflet + OpenStreetMap) com a posição do entregador (ao vivo),
// o destino e uma linha reta entre eles.
export function LiveMap({ me, dest, height = "h-56" }: { me: Point | null; dest: Point | null; height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const meMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  // Inicializa o mapa uma vez
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const center = dest ?? me ?? { lat: -23.55, lng: -46.63 };
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: false }).addAttribution("© OpenStreetMap").addTo(map);
    mapRef.current = map;
    // corrige tamanho após montar no layout
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      meMarker.current = null;
      destMarker.current = null;
      lineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza pinos, linha e enquadramento
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (dest) {
      if (!destMarker.current) destMarker.current = L.marker([dest.lat, dest.lng], { icon: destIcon() }).addTo(map);
      else destMarker.current.setLatLng([dest.lat, dest.lng]);
    }
    if (me) {
      if (!meMarker.current) meMarker.current = L.marker([me.lat, me.lng], { icon: courierIcon() }).addTo(map);
      else meMarker.current.setLatLng([me.lat, me.lng]);
    }

    if (me && dest) {
      const pts: L.LatLngTuple[] = [
        [me.lat, me.lng],
        [dest.lat, dest.lng],
      ];
      if (!lineRef.current) lineRef.current = L.polyline(pts, { color: BRAND, weight: 3, opacity: 0.7, dashArray: "6 8" }).addTo(map);
      else lineRef.current.setLatLngs(pts);
      map.fitBounds(L.latLngBounds(pts).pad(0.35), { animate: true });
    } else if (dest) {
      map.setView([dest.lat, dest.lng], 15, { animate: true });
    } else if (me) {
      map.setView([me.lat, me.lng], 15, { animate: true });
    }
  }, [me?.lat, me?.lng, dest?.lat, dest?.lng]);

  return <div ref={ref} className={`w-full overflow-hidden rounded-2xl border border-black/5 ${height}`} style={{ zIndex: 0 }} />;
}
