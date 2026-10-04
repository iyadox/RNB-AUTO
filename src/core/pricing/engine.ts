import { formatEuros, formatPercentBp } from "@/core/format";
import { roundHalfAwayFromZero } from "@/core/money";
import { PRICE_PIPELINE } from "./pipeline";
import { addWarning, createState, type PricingState } from "./state";
import type { EngineInput, LineKind, MarginLevel, PricingConfig, QuoteResult } from "./types";

/** Version du moteur, enregistrée dans chaque photographie d'estimation. */
export const ENGINE_VERSION = "1.0.0";

export class EngineInputError extends Error {}

function assertValidInput(input: EngineInput): void {
  const legs = [input.legs.emptyOut, input.legs.emptyBack, ...(input.legs.loaded ? [input.legs.loaded] : [])];
  for (const leg of legs) {
    if (!Number.isFinite(leg.km) || leg.km < 0 || !Number.isFinite(leg.minutes) || leg.minutes < 0) {
      throw new EngineInputError("Distances ou durées invalides.");
    }
  }
  if (input.serviceKind === "tow" && !input.legs.loaded) {
    throw new EngineInputError("Un remorquage doit avoir un trajet avec le véhicule chargé.");
  }
  if (!Number.isFinite(input.fuelPriceTtcMillis) || input.fuelPriceTtcMillis < 0) {
    throw new EngineInputError("Prix du carburant invalide.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.local.time)) {
    throw new EngineInputError("Heure invalide.");
  }
}

export function marginLevelOf(marginCents: number, marginRateBp: number, config: PricingConfig): MarginLevel {
  if (marginCents < 0) return "loss";
  if (marginCents < config.margin.minimumCents) return "below_minimum";
  if (marginRateBp < config.margin.targetBp) return "below_target";
  return "ok";
}

export function marginRate(marginCents: number, priceHtCents: number): number {
  if (priceHtCents <= 0) return marginCents < 0 ? -10_000 : 0;
  return roundHalfAwayFromZero((marginCents * 10_000) / priceHtCents);
}

export function addMarginWarnings(
  state: Pick<PricingState, "warnings">,
  level: MarginLevel,
  marginCents: number,
  marginRateBp: number,
  config: PricingConfig,
): void {
  const add = (code: "loss" | "margin_below_minimum" | "margin_below_target", message: string) =>
    addWarning(state as PricingState, code, message);
  if (level === "loss") {
    add("loss", `Cette intervention semble vendue à perte (${formatEuros(marginCents)} HT).`);
  } else if (level === "below_minimum") {
    add(
      "margin_below_minimum",
      `Marge très faible : ${formatEuros(marginCents)} HT, sous la marge minimale de ${formatEuros(config.margin.minimumCents)}.`,
    );
  } else if (level === "below_target") {
    add(
      "margin_below_target",
      `Marge faible : ${formatPercentBp(marginRateBp)}, sous la marge visée de ${formatPercentBp(config.margin.targetBp)}.`,
    );
  }
}

/** Ordre d'affichage des libellés au client : forfait, trajets, frais, suppléments, majorations, remises. */
const CLIENT_ITEM_KINDS: LineKind[] = ["fee", "leg", "fixed_fee", "supplement", "surcharge", "discount"];

/**
 * Calcule une estimation complète : prix client, coût interne, marge et détail ligne par ligne.
 * Fonction pure : mêmes entrées et mêmes réglages → même résultat.
 */
export function computeQuote(input: EngineInput, config: PricingConfig): QuoteResult {
  assertValidInput(input);
  const state = createState(input, config);
  for (const stage of PRICE_PIPELINE) stage.run(state);

  const t = state.t;
  const marginCents = t.priceHtCents - t.internalCostCents;
  const marginRateBp = marginRate(marginCents, t.priceHtCents);
  const marginLevel = marginLevelOf(marginCents, marginRateBp, config);
  addMarginWarnings(state, marginLevel, marginCents, marginRateBp, config);

  const includedLabels: string[] = [];
  const clientLines = [...state.lines].sort(
    (a, b) => CLIENT_ITEM_KINDS.indexOf(a.kind) - CLIENT_ITEM_KINDS.indexOf(b.kind),
  );
  for (const line of clientLines) {
    if (!line.clientVisible || line.informative || !line.clientLabel) continue;
    if (!CLIENT_ITEM_KINDS.includes(line.kind)) continue;
    if (line.amountCents === 0 && line.kind !== "fee" && line.kind !== "leg") continue;
    if (!includedLabels.includes(line.clientLabel)) includedLabels.push(line.clientLabel);
  }

  return {
    engineVersion: ENGINE_VERSION,
    lines: state.lines,
    totals: {
      legsCents: t.legsCents,
      basePriceCents: t.basePriceCents,
      supplementsCents: t.supplementsCents,
      fullServiceCents: t.fullServiceCents,
      surchargesCents: t.surchargesCents,
      discountsCents: t.discountsCents,
      computedPriceCents: t.computedPriceCents,
      roundedPriceCents: t.roundedPriceCents,
      finalPriceCents: t.finalPriceCents,
      priceTtcCents: t.priceTtcCents,
      priceHtCents: t.priceHtCents,
      vatCents: t.vatCents,
      internalCostCents: t.internalCostCents,
      fuelLiters: t.fuelLiters,
      fuelCostCents: t.fuelCostCents,
      marginCents,
      marginRateBp,
      marginLevel,
    },
    km: { ...state.km },
    billedKm: { ...state.billedKm },
    minutes: { ...state.minutes },
    flags: {
      minimumApplied: state.minimumApplied,
      profitabilityApplied: state.profitabilityApplied,
      hiddenReasons: [...state.hiddenReasons],
    },
    warnings: state.warnings,
    client: {
      priceTtcCents: state.hiddenReasons.length > 0 ? null : t.priceTtcCents,
      includedLabels,
      vehicleTripKm: input.legs.loaded ? Math.round(state.km.loaded * 10) / 10 : null,
      approachKm: Math.round(state.km.emptyOut * 10) / 10,
    },
  };
}
