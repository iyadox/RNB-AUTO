/**
 * Contrats des services cartographiques. Le reste du programme ne parle qu'à ces interfaces :
 * changer de fournisseur (IGN, OSRM, OpenRouteService, Google…) ne touche que les adaptateurs.
 */
import type { GeoPoint } from "@/core/quotes/types";

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  postcode: string | null;
  city: string | null;
  /** housenumber, street, municipality, locality, poi… */
  kind: string;
  score: number;
};

export type SearchOptions = { limit: number; near?: GeoPoint | null; signal: AbortSignal };

export interface GeocodingProvider {
  readonly id: string;
  readonly label: string;
  search(query: string, options: SearchOptions): Promise<GeocodeResult[]>;
  reverse(point: GeoPoint, options: { signal: AbortSignal }): Promise<GeocodeResult | null>;
}

export type RouteResult = { distanceMeters: number; durationSeconds: number };

export interface RoutingProvider {
  readonly id: string;
  readonly label: string;
  route(from: GeoPoint, to: GeoPoint, options: { optimization: "fastest" | "shortest"; signal: AbortSignal }): Promise<RouteResult>;
}

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
  ) {
    super(`${provider} : ${message}`);
  }
}
