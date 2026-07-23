"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
}

const BRAND = "#6E1423";

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
    html: `<div style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px 9999px 9999px 2px;background:#fff;border:2px solid ${BRAND};box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:15px">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

// Mapa real (Leaflet + OpenStreetMap): pino do entregador (ao vivo, chega via
// socket), pino do endereço de entrega e uma linha reta entre eles.
export function LiveMap({
  courier,
  dest,
  etaMinutes,
}: {
  courier: Point | null;
  dest: Point | null;
  etaMinutes?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const courierMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const center = dest ?? courier ?? { lat: -23.55, lng: -46.63 };
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: false }).addAttribution("© OpenStreetMap").addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      courierMarker.current = null;
      destMarker.current = null;
      lineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (dest) {
      if (!destMarker.current) destMarker.current = L.marker([dest.lat, dest.lng], { icon: destIcon() }).addTo(map);
      else destMarker.current.setLatLng([dest.lat, dest.lng]);
    }
    if (courier) {
      if (!courierMarker.current) courierMarker.current = L.marker([courier.lat, courier.lng], { icon: courierIcon() }).addTo(map);
      else courierMarker.current.setLatLng([courier.lat, courier.lng]);
    }

    if (courier && dest) {
      const pts: L.LatLngTuple[] = [
        [courier.lat, courier.lng],
        [dest.lat, dest.lng],
      ];
      if (!lineRef.current) lineRef.current = L.polyline(pts, { color: BRAND, weight: 3, opacity: 0.7, dashArray: "6 8" }).addTo(map);
      else lineRef.current.setLatLngs(pts);
      map.fitBounds(L.latLngBounds(pts).pad(0.35), { animate: true });
    } else if (dest) {
      map.setView([dest.lat, dest.lng], 15, { animate: true });
    } else if (courier) {
      map.setView([courier.lat, courier.lng], 15, { animate: true });
    }
  }, [courier?.lat, courier?.lng, dest?.lat, dest?.lng]);

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-black/5">
      <div ref={ref} className="h-full w-full" style={{ zIndex: 0 }} />
      {etaMinutes != null && (
        <span className="absolute bottom-2 left-2 z-[400] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow">
          ~{etaMinutes} min
        </span>
      )}
    </div>
  );
}
