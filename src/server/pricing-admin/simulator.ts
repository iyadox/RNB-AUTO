/**
 * Données du simulateur et de la saisie par téléphone, lues dans la version des tarifs en vigueur.
 */
import { eq } from "drizzle-orm";
import { toParisLocal } from "@/core/calendar/paris";
import { computeQuote, type PricingRule, type QuoteResult } from "@/core/pricing";
import { scenarioToEngineInput, type ReferenceScenario } from "@/core/quotes/types";
import type { SimulatorSituation, SimulatorVehicle, TrialField } from "@/components/admin/quote-simulator";
import { referenceTrips } from "@/server/db/schema";
import { currentFuelPrice } from "@/server/fuel/service";
import type { DbLike } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

/** Réglages proposés dans « Essai sans enregistrer » (les plus parlants). */
const TRIAL_CODES = ["fee.tow", "fee.on_site", "leg.empty_out", "leg.loaded", "leg.empty_back", "calendar.night", "calendar.sunday", "calendar.holiday"];

function trialField(rule: PricingRule): TrialField | null {
  const calc = rule.calculation;
  const value = (amount: number) => (rule.enabled ? amount : 0);
  if (calc.kind === "fixed") return { code: rule.code, label: rule.category === "fee" ? rule.label : `Majoration ${rule.label.toLowerCase()}`, kind: "fixed", value: value(calc.amountCents) };
  if (calc.kind === "per_km") return { code: rule.code, label: `${rule.label} (au km)`, kind: "per_km", value: value(calc.centsPerKm) };
  if (calc.kind === "percent") return { code: rule.code, label: `Majoration ${rule.label.toLowerCase()}`, kind: "percent", value: value(calc.rateBp) };
  return null;
}

export type ReferenceTripRow = { id: string; name: string; scenario: ReferenceScenario; result: QuoteResult | null };

export async function loadSimulatorData(db: DbLike) {
  const version = await getLatestVersion(db);
  if (!version) throw new Error("Aucune version des tarifs : lancez « npm run db:setup ».");
  const pricing = version.snapshot.pricing;
  const fuel = await currentFuelPrice(db, version.snapshot.fuel);
  const local = toParisLocal(new Date());
  const vehicles: SimulatorVehicle[] = pricing.vehicles
    .filter((v) => v.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, label, acceptance, clientVisible }) => ({ code, label, acceptance, clientVisible }));
  const situations: SimulatorSituation[] = pricing.situations
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, label, group, clientVisible }) => ({ code, label, group, clientVisible }));
  const trialFields = TRIAL_CODES.map((code) => pricing.rules.find((rule) => rule.code === code))
    .filter((rule): rule is PricingRule => rule !== undefined)
    .map(trialField)
    .filter((field): field is TrialField => field !== null);
  const depot = version.snapshot.depot;
  return {
    version,
    pricing,
    fuel,
    vehicles,
    situations,
    trialFields,
    minimum: pricing.minimumPrice,
    now: { isoWeekday: local.isoWeekday, time: local.time },
    depot: depot.lat !== null && depot.lng !== null ? { lat: depot.lat, lng: depot.lng } : null,
  };
}

/** Trajets types enregistrés, avec leur prix selon les tarifs en vigueur. */
export async function loadReferenceTrips(db: DbLike, data: Awaited<ReturnType<typeof loadSimulatorData>>): Promise<ReferenceTripRow[]> {
  const rows = await db.select().from(referenceTrips).where(eq(referenceTrips.active, true)).orderBy(referenceTrips.sortOrder, referenceTrips.createdAt);
  return rows.map((row) => {
    let result: QuoteResult | null = null;
    try {
      result = computeQuote(scenarioToEngineInput(row.scenario, data.fuel.priceTtcMillis, "admin"), data.pricing);
    } catch {
      // Trajet devenu incohérent (véhicule supprimé…) : affiché sans prix.
    }
    return { id: row.id, name: row.name, scenario: row.scenario, result };
  });
}
