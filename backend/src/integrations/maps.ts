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
