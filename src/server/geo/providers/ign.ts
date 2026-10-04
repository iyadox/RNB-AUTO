/**
 * Géoplateforme de l'IGN (service public, gratuit, sans clé) :
 * - géocodage : https://data.geopf.fr/geocodage (Base Adresse Nationale), 50 requêtes/s par IP ;
 * - itinéraire : https://data.geopf.fr/navigation/itineraire, 5 requêtes/s par IP.
 */
import type { GeoPoint } from "@/core/quotes/types";
import { fetchJson, isFiniteNumber } from "../http";
import { ProviderError, type GeocodeResult, type GeocodingProvider, type RouteResult, type RoutingProvider } from "../types";

const GEOCODING_BASE = "https://data.geopf.fr/geocodage";
const ROUTING_URL = "https://data.geopf.fr/navigation/itineraire";

type IgnFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    label?: string;
    score?: number;
    postcode?: string;
    city?: string;
    type?: string;
  };
};

export function parseIgnFeatures(data: { features?: IgnFeature[] }): GeocodeResult[] {
  const results: GeocodeResult[] = [];
  for (const feature of data.features ?? []) {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const label = feature.properties?.label;
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng) || !label) continue;
    results.push({
      label,
      lat,
      lng,
      postcode: feature.properties?.postcode ?? null,
      city: feature.properties?.city ?? null,
      kind: feature.properties?.type ?? "address",
      score: feature.properties?.score ?? 0,
    });
  }
  return results;
}

export class IgnGeocodingProvider implements GeocodingProvider {
  readonly id = "ign-geocodage";
  readonly label = "IGN Géoplateforme (adresses)";

  async search(query: string, options: { limit: number; near?: GeoPoint | null; signal: AbortSignal }) {
    const params = new URLSearchParams({ q: query, limit: String(options.limit), autocomplete: "1", index: "address" });
    if (options.near) {
      params.set("lat", options.near.lat.toFixed(5));
      params.set("lon", options.near.lng.toFixed(5));
    }
    const data = await fetchJson<{ features?: IgnFeature[] }>(this.id, `${GEOCODING_BASE}/search?${params}`, {
      signal: options.signal,
    });
    return parseIgnFeatures(data);
  }

  async reverse(point: GeoPoint, options: { signal: AbortSignal }) {
    const params = new URLSearchParams({ lat: point.lat.toFixed(6), lon: point.lng.toFixed(6), limit: "1", index: "address" });
    const data = await fetchJson<{ features?: IgnFeature[] }>(this.id, `${GEOCODING_BASE}/reverse?${params}`, {
      signal: options.signal,
    });
    return parseIgnFeatures(data)[0] ?? null;
  }
}

type IgnRoute = { distance?: number; duration?: number; distanceUnit?: string; timeUnit?: string };

export function parseIgnRoute(data: IgnRoute, provider = "ign-itineraire"): RouteResult {
  if (!isFiniteNumber(data.distance) || !isFiniteNumber(data.duration)) {
    throw new ProviderError(provider, "itinéraire introuvable");
  }
  const distanceFactor = data.distanceUnit === "kilometer" ? 1000 : 1;
  const timeFactor = data.timeUnit === "hour" ? 3600 : data.timeUnit === "minute" ? 60 : 1;
  return { distanceMeters: data.distance * distanceFactor, durationSeconds: data.duration * timeFactor };
}

export class IgnRoutingProvider implements RoutingProvider {
  readonly id = "ign-itineraire";
  readonly label = "IGN Géoplateforme (itinéraires)";

  async route(from: GeoPoint, to: GeoPoint, options: { optimization: "fastest" | "shortest"; signal: AbortSignal }) {
    const params = new URLSearchParams({
      resource: "bdtopo-osrm",
      profile: "car",
      optimization: options.optimization,
      start: `${from.lng.toFixed(6)},${from.lat.toFixed(6)}`,
      end: `${to.lng.toFixed(6)},${to.lat.toFixed(6)}`,
      distanceUnit: "meter",
      timeUnit: "second",
      getSteps: "false",
      getBbox: "false",
      geometryFormat: "polyline",
    });
    const data = await fetchJson<IgnRoute>(this.id, `${ROUTING_URL}?${params}`, { signal: options.signal });
    return parseIgnRoute(data, this.id);
  }
}
