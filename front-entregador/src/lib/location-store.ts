"use client";
import { create } from "zustand";

interface LocationState {
  lat: number | null;
  lng: number | null;
  usingGps: boolean;
  set: (lat: number, lng: number, usingGps: boolean) => void;
}

// Posição atual do próprio entregador (para o mapa da rota).
export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  usingGps: false,
  set: (lat, lng, usingGps) => set({ lat, lng, usingGps }),
}));
