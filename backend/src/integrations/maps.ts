import { env } from "../config/env.js";

// ===== MapService / geolocalização =====
// Mock: distância/ETA fake + move o pino em direção ao destino.
// Adapter real: Google Maps / OpenRouteService.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceKm: number;
  etaMinutes: number;
}

export interface MapService {
  routeInfo(from: LatLng, to: LatLng): Promise<RouteInfo>;
  // interpola um passo do ponto atual em direção ao destino (para o mock de movimento)
  stepToward(current: LatLng, dest: LatLng, fraction: number): LatLng;
  reverseGeocode(point: LatLng): Promise<string>;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

class MockMapService implements MapService {
  async routeInfo(from: LatLng, to: LatLng): Promise<RouteInfo> {
    const distanceKm = Math.max(0.3, haversineKm(from, to));
    // ~25 km/h em área urbana + 5 min de folga
    const etaMinutes = Math.round((distanceKm / 25) * 60) + 5;
    return { distanceKm: Math.round(distanceKm * 10) / 10, etaMinutes };
  }

  stepToward(current: LatLng, dest: LatLng, fraction: number): LatLng {
    return {
      lat: current.lat + (dest.lat - current.lat) * fraction,
      lng: current.lng + (dest.lng - current.lng) * fraction,
    };
  }

  async reverseGeocode(point: LatLng): Promise<string> {
    return `Lat ${point.lat.toFixed(5)}, Lng ${point.lng.toFixed(5)}`;
  }
}

// Adapter real stubbado — cai no mock enquanto não houver MAPS_API_KEY.
class RealMapService extends MockMapService {
  async routeInfo(from: LatLng, to: LatLng): Promise<RouteInfo> {
    if (!env.maps.apiKey) return super.routeInfo(from, to);
    // TODO(real): Directions/Matrix API com env.maps.apiKey.
    return super.routeInfo(from, to);
  }
}

export const mapService: MapService =
  env.maps.driver === "mock" ? new MockMapService() : new RealMapService();

export interface AddressParts {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

// Reverse geocoding: lat/lng -> componentes do endereço (Nominatim).
export async function reverseGeocode(point: LatLng): Promise<AddressParts | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${point.lat}&lon=${point.lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CabanaLanches/1.0 (delivery app)", "Accept-Language": "pt-BR" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address;
    if (!a) return null;
    const iso = a["ISO3166-2-lvl4"]; // ex.: "BR-SP"
    const uf = iso?.includes("-") ? iso.split("-")[1] : undefined;
    const cep = (a.postcode ?? "").replace(/\D/g, "");
    return {
      street: a.road ?? a.pedestrian ?? a.footway ?? a.residential ?? undefined,
      number: a.house_number ?? undefined,
      neighborhood: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district ?? undefined,
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? undefined,
      state: uf,
      cep: cep || undefined,
    };
  } catch {
    return null;
  }
}

// Geocodifica um endereço (rua/número/bairro/cidade/UF) em lat/lng.
// Usa Nominatim (OpenStreetMap) — grátis, sem chave. Retorna null se não achar.
export async function geocodeAddress(parts: {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
}): Promise<LatLng | null> {
  const line = [parts.street, parts.number].filter(Boolean).join(", ");
  const q = [line, parts.neighborhood, parts.city, parts.state, "Brasil"].filter(Boolean).join(", ");
  if (!q.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CabanaLanches/1.0 (delivery app)", "Accept-Language": "pt-BR" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit?.lat || !hit?.lon) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
