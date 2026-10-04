/**
 * Source officielle « Prix des carburants en France — flux instantané v2 » (data.economie.gouv.fr),
 * mise à jour toutes les 10 minutes. On prend la médiane des stations autour du dépôt.
 */
import type { GeoPoint } from "@/core/quotes/types";
import { fetchJson } from "@/server/geo/http";

export type FuelObservation = { priceTtcMillis: number; observedAt: string; scope: string; sampleSize: number };

export interface FuelPriceProvider {
  readonly label: string;
  fetch(params: { fuelType: string; center: GeoPoint; radiusKm: number; signal: AbortSignal }): Promise<FuelObservation>;
}

const DATASET_URL =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";

type Record = { [key: string]: unknown };

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[middle] as number) : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

export function parseFuelRecords(
  data: { results?: Record[] },
  fuelType: string,
  radiusKm: number,
  now = new Date(),
): FuelObservation {
  const priceField = `${fuelType}_prix`;
  const dateField = `${fuelType}_maj`;
  const prices: number[] = [];
  let latest = 0;
  for (const record of data.results ?? []) {
    const price = record[priceField];
    const updated = record[dateField];
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue;
    const time = typeof updated === "string" ? Date.parse(updated) : Number.NaN;
    // On ignore les prix de plus de 7 jours (station qui ne met plus à jour).
    if (Number.isFinite(time) && now.getTime() - time > 7 * 24 * 3600 * 1000) continue;
    prices.push(price);
    if (Number.isFinite(time)) latest = Math.max(latest, time);
  }
  if (prices.length < 3) throw new Error("pas assez de stations avec un prix récent");
  return {
    priceTtcMillis: Math.round(median(prices) * 1000),
    observedAt: new Date(latest || now.getTime()).toISOString(),
    scope: `Médiane de ${prices.length} stations à moins de ${radiusKm} km du dépôt`,
    sampleSize: prices.length,
  };
}

export class PrixCarburantsProvider implements FuelPriceProvider {
  readonly label = "prix-carburants.gouv.fr";

  async fetch(params: { fuelType: string; center: GeoPoint; radiusKm: number; signal: AbortSignal }) {
    if (!/^[a-z0-9]+$/.test(params.fuelType)) throw new Error("carburant inconnu");
    const field = `${params.fuelType}_prix`;
    const query = new URLSearchParams({
      select: `${field},${params.fuelType}_maj`,
      where: `within_distance(geom, geom'POINT(${params.center.lng.toFixed(5)} ${params.center.lat.toFixed(5)})', ${params.radiusKm}km) and ${field} is not null`,
      limit: "100",
    });
    const data = await fetchJson<{ results?: Record[] }>("prix-carburants", `${DATASET_URL}?${query}`, { signal: params.signal });
    return parseFuelRecords(data, params.fuelType, params.radiusKm);
  }
}
