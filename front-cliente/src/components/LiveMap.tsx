"use client";
import dynamic from "next/dynamic";

// Leaflet usa `window` — carrega o mapa só no cliente (sem SSR).
export const LiveMap = dynamic(() => import("./LiveMapImpl").then((m) => m.LiveMap), { ssr: false });
