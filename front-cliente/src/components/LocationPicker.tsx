"use client";
import dynamic from "next/dynamic";

// Leaflet usa `window` — carrega o picker só no cliente (sem SSR).
export const LocationPicker = dynamic(() => import("./LocationPickerImpl").then((m) => m.LocationPicker), { ssr: false });
