/**
 * Prix du carburant : manuel, ou automatique (données officielles « Prix des carburants en France »)
 * avec repli sur la dernière valeur connue puis sur le prix manuel. Le calcul n'est jamais bloqué.
 */
import { and, desc, eq } from "drizzle-orm";
import type { FuelSource } from "@/core/quotes/types";
import type { ConfigSnapshot } from "@/core/settings/snapshot";
import { formatFuelPrice } from "@/core/format";
import type { DbLike } from "@/server/settings/repository";
import { fuelPrices } from "@/server/db/schema";
import { PrixCarburantsProvider, type FuelPriceProvider } from "./provider";

export type FuelPriceInfo = { priceTtcMillis: number; source: FuelSource; observedAt: string | null; origin: string };

export async function currentFuelPrice(db: DbLike, fuel: ConfigSnapshot["fuel"]): Promise<FuelPriceInfo> {
  const manual: FuelPriceInfo = {
    priceTtcMillis: fuel.manualPriceMillis,
    source: "manual",
    observedAt: null,
    origin: "Prix saisi dans « Mes tarifs »",
  };
  if (fuel.mode !== "auto") return manual;
  try {
    const [latest] = await db
      .select()
      .from(fuelPrices)
      .where(and(eq(fuelPrices.status, "accepted"), eq(fuelPrices.fuelType, fuel.type)))
      .orderBy(desc(fuelPrices.fetchedAt))
      .limit(1);
    if (!latest) return { ...manual, origin: "Aucun prix automatique encore récupéré : prix manuel utilisé" };
    const ageHours = (Date.now() - latest.observedAt.getTime()) / 3_600_000;
    if (ageHours > fuel.auto.maxAgeHours) {
      return { ...manual, origin: `Prix automatique trop ancien (${Math.round(ageHours)} h) : prix manuel utilisé` };
    }
    return {
      priceTtcMillis: latest.priceTtcMillis,
      source: "auto",
      observedAt: latest.observedAt.toISOString(),
      origin: `${latest.scope} (${latest.source})`,
    };
  } catch {
    return { ...manual, origin: "Prix automatique indisponible : prix manuel utilisé" };
  }
}

export type RefreshResult = { ok: boolean; message: string; priceTtcMillis?: number };

/** Récupère le prix du jour et l'enregistre s'il est vraisemblable. */
export async function refreshFuelPrice(
  db: DbLike,
  snapshot: Pick<ConfigSnapshot, "fuel" | "depot">,
  provider: FuelPriceProvider = new PrixCarburantsProvider(),
): Promise<RefreshResult> {
  const { fuel, depot } = snapshot;
  if (depot.lat === null || depot.lng === null) {
    return { ok: false, message: "La position du dépôt n'est pas encore connue (Paramètres → Adresse de départ)." };
  }
  try {
    const observation = await provider.fetch({
      fuelType: fuel.type,
      center: { lat: depot.lat, lng: depot.lng },
      radiusKm: fuel.auto.radiusKm,
      signal: AbortSignal.timeout(8000),
    });
    const inBounds =
      observation.priceTtcMillis >= fuel.auto.minPriceMillis && observation.priceTtcMillis <= fuel.auto.maxPriceMillis;
    await db.insert(fuelPrices).values({
      observedAt: new Date(observation.observedAt),
      fuelType: fuel.type,
      priceTtcMillis: observation.priceTtcMillis,
      source: provider.label,
      scope: observation.scope,
      sampleSize: observation.sampleSize,
      status: inBounds ? "accepted" : "rejected",
      rejectionReason: inBounds ? null : "Prix hors des limites jugées vraisemblables",
    });
    return inBounds
      ? { ok: true, message: `Prix mis à jour : ${formatFuelPrice(observation.priceTtcMillis)} (${observation.scope}).`, priceTtcMillis: observation.priceTtcMillis }
      : { ok: false, message: `Prix reçu (${formatFuelPrice(observation.priceTtcMillis)}) jugé aberrant : ignoré.` };
  } catch (error) {
    return {
      ok: false,
      message: `Service des prix du carburant indisponible (${error instanceof Error ? error.message : "erreur"}). Le dernier prix connu ou le prix manuel reste utilisé.`,
    };
  }
}
