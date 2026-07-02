"use client";
import { useEffect, useRef } from "react";
import { api } from "./api";
import { useLocationStore } from "./location-store";

interface Target {
  lat: number;
  lng: number;
}

// Envia a geolocalização do entregador ao backend enquanto houver entrega em rota.
// Usa GPS real (navigator.geolocation) quando disponível; caso contrário, simula
// o deslocamento em direção ao destino (útil em desktop/preview sem GPS) — assim
// o cliente vê o pino se mover em tempo real de qualquer forma.
export function useLocationTracking(enabled: boolean, target: Target | null) {
  const setLoc = useLocationStore((s) => s.set);
  const simPos = useRef<Target | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || !target) return;

    let watchId: number | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const send = async (lat: number, lng: number, gps: boolean) => {
      setLoc(lat, lng, gps);
      const now = Date.now();
      if (now - lastSent.current < 4000) return; // throttle ~4s
      lastSent.current = now;
      try {
        await api("/courier/location", { method: "PATCH", body: { lat, lng } });
      } catch {
        /* ignora falhas transitórias */
      }
    };

    // ponto de partida da simulação: ~1.5km a nordeste do destino
    simPos.current = { lat: target.lat + 0.014, lng: target.lng + 0.014 };

    const stepSim = () => {
      if (cancelled || !simPos.current) return;
      const p = simPos.current;
      const next = {
        lat: p.lat + (target.lat - p.lat) * 0.18,
        lng: p.lng + (target.lng - p.lng) * 0.18,
      };
      simPos.current = next;
      send(next.lat, next.lng, false);
    };

    // tenta GPS real
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => send(pos.coords.latitude, pos.coords.longitude, true),
        () => {
          // sem permissão/erro -> simula
          if (!interval) {
            stepSim();
            interval = setInterval(stepSim, 4000);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      );
    }

    // fallback: se em 3s não houver fix de GPS, começa a simular
    const bootstrap = setTimeout(() => {
      if (!cancelled && !interval && !useLocationStore.getState().usingGps) {
        stepSim();
        interval = setInterval(stepSim, 4000);
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (interval) clearInterval(interval);
      clearTimeout(bootstrap);
    };
  }, [enabled, target?.lat, target?.lng, setLoc]);
}
