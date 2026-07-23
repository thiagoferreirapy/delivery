import { api } from "./api";

// Geocodifica um endereço via backend (que usa Nominatim/OpenStreetMap).
// Feito no backend para evitar CORS/limite ao chamar o Nominatim do navegador.
export async function geocode(parts: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): Promise<{ lat: number; lng: number } | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(parts)) if (v) qs.set(k, v);
  if (![...qs.keys()].length) return null;
  try {
    return await api<{ lat: number; lng: number } | null>(`/me/geocode?${qs.toString()}`);
  } catch {
    return null;
  }
}

export interface AddressParts {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

// Reverse: coordenada -> campos do endereço (ao arrastar o pino).
export async function reverseGeocode(p: { lat: number; lng: number }): Promise<AddressParts | null> {
  try {
    return await api<AddressParts | null>(`/me/reverse-geocode?lat=${p.lat}&lng=${p.lng}`);
  } catch {
    return null;
  }
}
