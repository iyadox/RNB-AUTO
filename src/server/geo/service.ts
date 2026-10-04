/**
 * Service d'adresses et d'itinéraires : seul point d'entrée vers les fournisseurs cartographiques.
 * Chaque appel a un délai maximal ; en cas d'échec, le fournisseur suivant prend le relais.
 * Les distances déjà calculées sont gardées en cache (une même paire d'adresses ne change pas).
 */
import { eq } from "drizzle-orm";
import type { GeoPoint, ResolvedLeg } from "@/core/quotes/types";
import { getDb } from "@/server/db/client";
import { routeCache } from "@/server/db/schema";
import { isProviderAvailable, reportFailure, reportSuccess } from "./provider-health";
import { OpenRouteServiceProvider, OsrmRoutingProvider, PhotonGeocodingProvider } from "./providers/fallbacks";
import { IgnGeocodingProvider, IgnRoutingProvider } from "./providers/ign";
import { SimulationGeocodingProvider, SimulationRoutingProvider } from "./providers/simulation";
import type { GeocodeResult, GeocodingProvider, RoutingProvider } from "./types";

const GEOCODING_TIMEOUT_MS = 3500;
const ROUTING_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 30 * 24 * 3600 * 1000;

export function isSimulationMode(): boolean {
  return process.env.GEO_PROVIDER === "simulation";
}

/** La simulation (distances approximatives) n'est jamais utilisée en production, sauf autorisation explicite. */
export function simulationAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_GEO_SIMULATION === "1";
}

function geocodingProviders(): GeocodingProvider[] {
  if (isSimulationMode()) return simulationAllowed() ? [new SimulationGeocodingProvider()] : [];
  return [new IgnGeocodingProvider(), new PhotonGeocodingProvider()];
}

export function routingProviders(): RoutingProvider[] {
  if (isSimulationMode()) return simulationAllowed() ? [new SimulationRoutingProvider()] : [];
  const providers: RoutingProvider[] = [new IgnRoutingProvider(), new OsrmRoutingProvider()];
  const orsKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  if (orsKey) providers.push(new OpenRouteServiceProvider(orsKey));
  return providers;
}

export function providerLabels(): { geocoding: string[]; routing: string[] } {
  return { geocoding: geocodingProviders().map((p) => p.label), routing: routingProviders().map((p) => p.label) };
}

// Petit cache mémoire pour l'autocomplétion (même recherche tapée par plusieurs personnes).
const searchCache = new Map<string, { at: number; results: GeocodeResult[] }>();

export async function searchAddresses(query: string, near?: GeoPoint | null, limit = 5): Promise<GeocodeResult[]> {
  const q = query.trim().replace(/\s+/g, " ");
  if (q.length < 3) return [];
  const cacheKey = `${q.toLowerCase()}|${near ? `${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.results;

  for (const provider of geocodingProviders()) {
    if (!isProviderAvailable(provider.id)) continue;
    try {
      const results = await provider.search(q, { limit, near, signal: AbortSignal.timeout(GEOCODING_TIMEOUT_MS) });
      reportSuccess(provider.id, "geocoding");
      if (searchCache.size > 500) searchCache.clear();
      searchCache.set(cacheKey, { at: Date.now(), results });
      return results;
    } catch (error) {
      reportFailure(provider.id, "geocoding", error instanceof Error ? error.message : "erreur");
    }
  }
  return [];
}

export async function reverseGeocode(point: GeoPoint): Promise<GeocodeResult | null> {
  for (const provider of geocodingProviders()) {
    if (!isProviderAvailable(provider.id)) continue;
    try {
      const result = await provider.reverse(point, { signal: AbortSignal.timeout(GEOCODING_TIMEOUT_MS) });
      reportSuccess(provider.id, "geocoding");
      return result;
    } catch (error) {
      reportFailure(provider.id, "geocoding", error instanceof Error ? error.message : "erreur");
    }
  }
  return null;
}

/** Meilleure correspondance pour une adresse tapée sans choisir de suggestion. */
export async function geocodeBest(label: string, near?: GeoPoint | null): Promise<GeocodeResult | null> {
  const results = await searchAddresses(label, near, 1);
  const best = results[0];
  return best && best.score >= 0.45 ? best : null;
}

function cacheKey(from: GeoPoint, to: GeoPoint, optimization: string): string {
  const p = (point: GeoPoint) => `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
  return `${optimization}:${p(from)}>${p(to)}`;
}

export class RoutingUnavailableError extends Error {}

/** Distance et durée entre deux points, avec cache et fournisseurs de secours. */
export async function routeBetween(from: GeoPoint, to: GeoPoint, optimization: "fastest" | "shortest"): Promise<ResolvedLeg> {
  if (Math.abs(from.lat - to.lat) < 1e-5 && Math.abs(from.lng - to.lng) < 1e-5) {
    return { km: 0, minutes: 0, provider: "identique", fromCache: false };
  }
  const key = cacheKey(from, to, optimization);
  const simulation = isSimulationMode();
  const db = await getDb().catch(() => null);
  if (db && !simulation) {
    try {
      const [hit] = await db.select().from(routeCache).where(eq(routeCache.key, key));
      if (hit && Date.now() - hit.createdAt.getTime() < CACHE_TTL_MS) {
        return { km: hit.distanceMeters / 1000, minutes: hit.durationSeconds / 60, provider: hit.provider, fromCache: true };
      }
    } catch {
      // cache indisponible : on calcule
    }
  }

  const errors: string[] = [];
  for (const provider of routingProviders()) {
    if (!isProviderAvailable(provider.id)) {
      errors.push(`${provider.id} : temporairement écarté`);
      continue;
    }
    try {
      const result = await provider.route(from, to, { optimization, signal: AbortSignal.timeout(ROUTING_TIMEOUT_MS) });
      reportSuccess(provider.id, "routing");
      if (db && !simulation) {
        await db
          .insert(routeCache)
          .values({ key, provider: provider.id, distanceMeters: result.distanceMeters, durationSeconds: result.durationSeconds })
          .onConflictDoUpdate({
            target: routeCache.key,
            set: { provider: provider.id, distanceMeters: result.distanceMeters, durationSeconds: result.durationSeconds, createdAt: new Date() },
          })
          .catch(() => undefined);
      }
      return {
        km: Math.round(result.distanceMeters) / 1000,
        minutes: Math.round(result.durationSeconds / 6) / 10,
        provider: provider.id,
        fromCache: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "erreur";
      errors.push(message);
      reportFailure(provider.id, "routing", message);
    }
  }
  throw new RoutingUnavailableError(errors.join(" · ") || "Aucun service d'itinéraire disponible.");
}

/** Les trois trajets : dépôt → client, client → destination (si remorquage), destination → dépôt. */
export async function computeLegs(params: {
  depot: GeoPoint;
  pickup: GeoPoint;
  dropoff: GeoPoint | null;
  optimization: "fastest" | "shortest";
}): Promise<{ emptyOut: ResolvedLeg; loaded: ResolvedLeg | null; emptyBack: ResolvedLeg }> {
  const { depot, pickup, dropoff, optimization } = params;
  const [emptyOut, loaded, emptyBack] = await Promise.all([
    routeBetween(depot, pickup, optimization),
    dropoff ? routeBetween(pickup, dropoff, optimization) : Promise.resolve(null),
    routeBetween(dropoff ?? pickup, depot, optimization),
  ]);
  return { emptyOut, loaded, emptyBack };
}
