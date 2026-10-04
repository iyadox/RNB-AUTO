/**
 * Fournisseurs de secours :
 * - Photon (Komoot, données OpenStreetMap) pour les adresses ;
 * - OSRM (serveur public de démonstration) pour les itinéraires ;
 * - OpenRouteService si une clé gratuite est configurée (OPENROUTESERVICE_API_KEY).
 */
import type { GeoPoint } from "@/core/quotes/types";
import { fetchJson, isFiniteNumber } from "../http";
import { ProviderError, type GeocodeResult, type GeocodingProvider, type RouteResult, type RoutingProvider } from "../types";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    countrycode?: string;
    type?: string;
  };
};

export function parsePhotonFeatures(data: { features?: PhotonFeature[] }): GeocodeResult[] {
  const results: GeocodeResult[] = [];
  for (const feature of data.features ?? []) {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const p = feature.properties ?? {};
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng) || (p.countrycode && p.countrycode !== "FR")) continue;
    const streetPart = p.street ? `${p.housenumber ? `${p.housenumber} ` : ""}${p.street}` : p.name;
    const cityPart = [p.postcode, p.city].filter(Boolean).join(" ");
    const label = [streetPart, cityPart].filter(Boolean).join(", ");
    if (!label) continue;
    results.push({
      label,
      lat,
      lng,
      postcode: p.postcode ?? null,
      city: p.city ?? null,
      kind: p.type ?? "address",
      score: 0.6,
    });
  }
  return results;
}

export class PhotonGeocodingProvider implements GeocodingProvider {
  readonly id = "photon";
  readonly label = "Photon (OpenStreetMap)";

  async search(query: string, options: { limit: number; near?: GeoPoint | null; signal: AbortSignal }) {
    const params = new URLSearchParams({ q: query, limit: String(options.limit), lang: "fr" });
    if (options.near) {
      params.set("lat", options.near.lat.toFixed(5));
      params.set("lon", options.near.lng.toFixed(5));
    }
    const data = await fetchJson<{ features?: PhotonFeature[] }>(this.id, `https://photon.komoot.io/api/?${params}`, {
      signal: options.signal,
    });
    return parsePhotonFeatures(data);
  }

  async reverse(point: GeoPoint, options: { signal: AbortSignal }) {
    const params = new URLSearchParams({ lat: point.lat.toFixed(6), lon: point.lng.toFixed(6), lang: "fr" });
    const data = await fetchJson<{ features?: PhotonFeature[] }>(this.id, `https://photon.komoot.io/reverse?${params}`, {
      signal: options.signal,
    });
    return parsePhotonFeatures(data)[0] ?? null;
  }
}

export function parseOsrmRoute(data: { code?: string; routes?: { distance?: number; duration?: number }[] }): RouteResult {
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route || !isFiniteNumber(route.distance) || !isFiniteNumber(route.duration)) {
    throw new ProviderError("osrm", "itinéraire introuvable");
  }
  return { distanceMeters: route.distance, durationSeconds: route.duration };
}

export class OsrmRoutingProvider implements RoutingProvider {
  readonly id = "osrm";
  readonly label = "OSRM (OpenStreetMap)";

  async route(from: GeoPoint, to: GeoPoint, options: { optimization: "fastest" | "shortest"; signal: AbortSignal }) {
    const coords = `${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}`;
    const data = await fetchJson<{ code?: string; routes?: { distance?: number; duration?: number }[] }>(
      this.id,
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&alternatives=false&steps=false`,
      { signal: options.signal },
    );
    return parseOsrmRoute(data);
  }
}

export function parseOrsRoute(data: { features?: { properties?: { summary?: { distance?: number; duration?: number } } }[] }): RouteResult {
  const summary = data.features?.[0]?.properties?.summary;
  if (!summary || !isFiniteNumber(summary.distance) || !isFiniteNumber(summary.duration)) {
    throw new ProviderError("openrouteservice", "itinéraire introuvable");
  }
  return { distanceMeters: summary.distance, durationSeconds: summary.duration };
}

export class OpenRouteServiceProvider implements RoutingProvider {
  readonly id = "openrouteservice";
  readonly label = "OpenRouteService";

  constructor(private readonly apiKey: string) {}

  async route(from: GeoPoint, to: GeoPoint, options: { optimization: "fastest" | "shortest"; signal: AbortSignal }) {
    const params = new URLSearchParams({
      start: `${from.lng.toFixed(6)},${from.lat.toFixed(6)}`,
      end: `${to.lng.toFixed(6)},${to.lat.toFixed(6)}`,
    });
    const data = await fetchJson<{ features?: { properties?: { summary?: { distance?: number; duration?: number } } }[] }>(
      this.id,
      `https://api.openrouteservice.org/v2/directions/driving-car?${params}`,
      { signal: options.signal, headers: { Authorization: this.apiKey } },
    );
    return parseOrsRoute(data);
  }
}
