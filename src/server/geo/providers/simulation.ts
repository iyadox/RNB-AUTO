/**
 * Fournisseur de SIMULATION, sans internet : uniquement pour le développement et les tests
 * (GEO_PROVIDER=simulation). Les distances sont approximatives (vol d'oiseau × 1,3) :
 * il est refusé en production, où aucun prix ne doit reposer sur une approximation.
 */
import type { GeoPoint } from "@/core/quotes/types";
import type { GeocodeResult, GeocodingProvider, RouteResult, RoutingProvider } from "../types";

type Place = { name: string; postcode: string; lat: number; lng: number };

export const SIMULATION_PLACES: Place[] = [
  { name: "Bobigny", postcode: "93000", lat: 48.9077, lng: 2.4397 },
  { name: "Drancy", postcode: "93700", lat: 48.923, lng: 2.4455 },
  { name: "Pantin", postcode: "93500", lat: 48.8944, lng: 2.4093 },
  { name: "Bondy", postcode: "93140", lat: 48.9022, lng: 2.4828 },
  { name: "Noisy-le-Sec", postcode: "93130", lat: 48.891, lng: 2.46 },
  { name: "Romainville", postcode: "93230", lat: 48.884, lng: 2.435 },
  { name: "Aubervilliers", postcode: "93300", lat: 48.9146, lng: 2.3821 },
  { name: "La Courneuve", postcode: "93120", lat: 48.9322, lng: 2.3966 },
  { name: "Saint-Denis", postcode: "93200", lat: 48.9362, lng: 2.3574 },
  { name: "Saint-Ouen-sur-Seine", postcode: "93400", lat: 48.9123, lng: 2.3342 },
  { name: "Montreuil", postcode: "93100", lat: 48.8611, lng: 2.4437 },
  { name: "Bagnolet", postcode: "93170", lat: 48.8692, lng: 2.4181 },
  { name: "Rosny-sous-Bois", postcode: "93110", lat: 48.8746, lng: 2.4865 },
  { name: "Aulnay-sous-Bois", postcode: "93600", lat: 48.9386, lng: 2.4973 },
  { name: "Le Blanc-Mesnil", postcode: "93150", lat: 48.9385, lng: 2.4614 },
  { name: "Sevran", postcode: "93270", lat: 48.9389, lng: 2.5275 },
  { name: "Villepinte", postcode: "93420", lat: 48.962, lng: 2.533 },
  { name: "Noisy-le-Grand", postcode: "93160", lat: 48.8486, lng: 2.5526 },
  { name: "Épinay-sur-Seine", postcode: "93800", lat: 48.9553, lng: 2.3092 },
  { name: "Paris 1er", postcode: "75001", lat: 48.8606, lng: 2.3376 },
  { name: "Paris 11e", postcode: "75011", lat: 48.859, lng: 2.38 },
  { name: "Paris 12e", postcode: "75012", lat: 48.8412, lng: 2.3876 },
  { name: "Paris 15e", postcode: "75015", lat: 48.8412, lng: 2.3003 },
  { name: "Paris 18e", postcode: "75018", lat: 48.8925, lng: 2.3444 },
  { name: "Paris 19e", postcode: "75019", lat: 48.8871, lng: 2.3848 },
  { name: "Paris 20e", postcode: "75020", lat: 48.8634, lng: 2.4011 },
  { name: "Créteil", postcode: "94000", lat: 48.7904, lng: 2.4556 },
  { name: "Vincennes", postcode: "94300", lat: 48.8474, lng: 2.439 },
  { name: "Vitry-sur-Seine", postcode: "94400", lat: 48.7875, lng: 2.3928 },
  { name: "Nanterre", postcode: "92000", lat: 48.8924, lng: 2.2071 },
  { name: "Boulogne-Billancourt", postcode: "92100", lat: 48.8397, lng: 2.2399 },
  { name: "Argenteuil", postcode: "95100", lat: 48.9472, lng: 2.2467 },
  { name: "Cergy", postcode: "95000", lat: 49.0364, lng: 2.0761 },
  { name: "Roissy-en-France", postcode: "95700", lat: 49.0035, lng: 2.5162 },
  { name: "Versailles", postcode: "78000", lat: 48.8049, lng: 2.1204 },
  { name: "Évry-Courcouronnes", postcode: "91000", lat: 48.6292, lng: 2.4409 },
  { name: "Meaux", postcode: "77100", lat: 48.9601, lng: 2.8788 },
  { name: "Chelles", postcode: "77500", lat: 48.8786, lng: 2.5906 },
  { name: "Rambouillet", postcode: "78120", lat: 48.644, lng: 1.829 },
  { name: "Lyon", postcode: "69000", lat: 45.764, lng: 4.8357 },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function toResult(place: Place, street: string | null, score: number): GeocodeResult {
  const label = street ? `${street}, ${place.postcode} ${place.name}` : `${place.name} (${place.postcode})`;
  return { label, lat: place.lat, lng: place.lng, postcode: place.postcode, city: place.name, kind: street ? "housenumber" : "municipality", score };
}

export class SimulationGeocodingProvider implements GeocodingProvider {
  readonly id = "simulation";
  readonly label = "Simulation (sans internet)";

  async search(query: string, options: { limit: number }) {
    const q = normalize(query);
    if (q.length < 2) return [];
    const streetMatch = query.match(/^\s*(\d+[\w\s'’.-]*?)(?:,|\s+\d{5}\b)/);
    const street = streetMatch?.[1]?.trim() ?? null;
    const scored = SIMULATION_PLACES.map((place) => {
      const name = normalize(place.name);
      let score = 0;
      if (q.includes(name)) score = 1;
      else if (name.startsWith(q) || q.split(" ").some((token) => token.length > 2 && name.includes(token))) score = 0.7;
      if (q.includes(place.postcode)) score = Math.max(score, 0.9);
      return { place, score };
    })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, options.limit).map((entry) => toResult(entry.place, street, entry.score));
  }

  async reverse(point: GeoPoint) {
    const nearest = [...SIMULATION_PLACES].sort((a, b) => haversineKm(point, a) - haversineKm(point, b))[0];
    return nearest ? toResult(nearest, "Position GPS", 0.9) : null;
  }
}

export class SimulationRoutingProvider implements RoutingProvider {
  readonly id = "simulation";
  readonly label = "Simulation (vol d'oiseau × 1,3)";

  async route(from: GeoPoint, to: GeoPoint): Promise<RouteResult> {
    const km = haversineKm(from, to) * 1.3;
    const speedKmh = km < 10 ? 28 : km < 30 ? 40 : 65;
    return { distanceMeters: Math.round(km * 1000), durationSeconds: Math.round((km / speedKmh) * 3600) };
  }
}
