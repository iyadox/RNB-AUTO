/**
 * Exemples de prix de l'accueil (docs/09, E.5) : journée, nuit et dimanche, calculés côté serveur
 * par le moteur tarifaire avec la DERNIÈRE version des tarifs. Aucune valeur commerciale ici :
 * le trajet type vient des données de départ (`HOME_EXAMPLE_SCENARIO`), les prix, les libellés et
 * l'heure de nuit viennent des réglages enregistrés.
 *
 * - journée : le trajet type tel quel ;
 * - nuit : le même trajet, à l'heure de début de la première plage horaire active (catégorie
 *   `time_slot`, condition `time_between`) ; absent s'il n'y en a pas ;
 * - dimanche : le même trajet, un dimanche, à l'heure du trajet type ;
 * - les libellés (sans montant) suivent le réglage « Montrer au client le nom des suppléments ».
 *
 * `null` si l'exemple est désactivé (`site.showExamplePrice`), si aucun tarif n'est enregistré,
 * si le moteur ne propose pas de prix pour la journée, ou en cas d'erreur (le site reste utilisable).
 */
import { WEEKDAY_LABELS } from "@/core/format";
import { computeQuote, type PricingConfig } from "@/core/pricing";
import { clientIncludedLabels } from "@/core/quotes/client-view";
import { scenarioToEngineInput, type ReferenceScenario } from "@/core/quotes/types";
import type { ConfigSnapshot } from "@/core/settings/snapshot";
import type { IsoWeekday } from "@/core/calendar/paris";
import { getDb } from "@/server/db/client";
import { HOME_EXAMPLE_SCENARIO } from "@/server/db/seed-data";
import { loadSettingValue } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export type PriceExample = {
  priceTtcCents: number;
  /** Ce que comprend le prix, sans montant (libellés renvoyés par le moteur). */
  includedLabels: string[];
  /** Moment de l'exemple, en toutes lettres : « un mardi après-midi », « un mardi à 22 h ». */
  when: string;
  /** Distance du dépôt jusqu'au véhicule (km), et distance de transport (km), du trajet type. */
  approachKm: number;
  loadedKm: number;
};

export type HomePriceExamples = { weekday: PriceExample; night: PriceExample | null; sunday: PriceExample | null };

const SUNDAY: IsoWeekday = 7;

/** « 22:00 » → « 22 h » ; « 06:30 » → « 6 h 30 ». */
export function hourLabel(time: string): string {
  const [hours = "0", minutes = "00"] = time.split(":");
  const h = Number(hours);
  return minutes === "00" ? `${h} h` : `${h} h ${minutes}`;
}

/** Partie du jour en toutes lettres (« après-midi »), sinon l'heure (« à 2 h »). */
function dayPart(time: string): string {
  const h = Number(time.split(":")[0] ?? 0);
  if (h >= 12 && h < 18) return "après-midi";
  if (h >= 6 && h < 12) return "matin";
  if (h >= 18 && h < 22) return "en soirée";
  return `à ${hourLabel(time)}`;
}

const weekdayName = (day: IsoWeekday) => WEEKDAY_LABELS[day].toLowerCase();

/** Heure de début de la première plage horaire active (ordre du moteur : priorité, puis code). */
export function firstNightStart(pricing: PricingConfig): string | null {
  const slots = pricing.rules
    .filter((rule) => rule.enabled && rule.ledger === "client_price" && rule.category === "time_slot")
    .sort((a, b) => a.priority - b.priority || a.code.localeCompare(b.code));
  for (const rule of slots) {
    const condition = rule.conditions.find((c) => c.type === "time_between");
    if (condition && condition.type === "time_between") return condition.start;
  }
  return null;
}

function example(snapshot: ConfigSnapshot, scenario: ReferenceScenario, when: string): PriceExample | null {
  const result = computeQuote(scenarioToEngineInput(scenario, snapshot.fuel.manualPriceMillis, "online"), snapshot.pricing);
  const price = result.client.priceTtcCents;
  if (price === null || price <= 0) return null;
  return {
    priceTtcCents: price,
    includedLabels: clientIncludedLabels(result, snapshot.estimate.showSupplementLabels),
    when,
    approachKm: scenario.legs.emptyOut.km,
    loadedKm: scenario.legs.loaded?.km ?? 0,
  };
}

/** Calcul pur des trois exemples à partir d'une version des tarifs (testé sans base). */
export function buildHomePriceExamples(
  snapshot: ConfigSnapshot,
  scenario: ReferenceScenario = HOME_EXAMPLE_SCENARIO,
): HomePriceExamples | null {
  const weekday = example(snapshot, scenario, `un ${weekdayName(scenario.isoWeekday)} ${dayPart(scenario.time)}`);
  if (!weekday) return null;

  const nightStart = firstNightStart(snapshot.pricing);
  const night = nightStart
    ? example(snapshot, { ...scenario, time: nightStart }, `un ${weekdayName(scenario.isoWeekday)} à ${hourLabel(nightStart)}`)
    : null;

  const sunday =
    scenario.isoWeekday === SUNDAY
      ? null
      : example(snapshot, { ...scenario, isoWeekday: SUNDAY }, `un ${weekdayName(SUNDAY)} ${dayPart(scenario.time)}`);

  return { weekday, night, sunday };
}

export async function getHomePriceExamples(): Promise<HomePriceExamples | null> {
  try {
    const db = await getDb();
    const [enabled, version] = await Promise.all([loadSettingValue(db, "site.showExamplePrice"), getLatestVersion(db)]);
    if (!enabled || !version) return null;
    return buildHomePriceExamples(version.snapshot);
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[site] exemples de prix de l'accueil indisponibles :", error);
    }
    return null;
  }
}
