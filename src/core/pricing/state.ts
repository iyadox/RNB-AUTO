import { formatEuros, formatKm, formatMinutes, formatPercentBp } from "@/core/format";
import { htToTtc, percentOf, roundHalfAwayFromZero, ttcToHt } from "@/core/money";
import { matchesAll, type ConditionFacts } from "./conditions";
import type {
  EngineInput,
  HiddenReason,
  Ledger,
  LegKey,
  PricingConfig,
  PricingRule,
  QuoteLine,
  RuleCategory,
  Warning,
  WarningCode,
} from "./types";

/** État d'un calcul : créé à neuf pour chaque calcul, puis enrichi étape par étape. */
export type PricingState = {
  readonly input: EngineInput;
  readonly config: PricingConfig;
  readonly facts: ConditionFacts;
  readonly km: Record<LegKey, number> & { total: number };
  readonly billedKm: Record<LegKey, number>;
  readonly minutes: Record<LegKey, number> & { driving: number; handling: number };
  readonly lines: QuoteLine[];
  readonly warnings: Warning[];
  readonly hiddenReasons: HiddenReason[];
  t: {
    legsCents: number;
    basePriceCents: number;
    supplementsCents: number;
    fullServiceCents: number;
    surchargesCents: number;
    discountsCents: number;
    computedPriceCents: number;
    roundedPriceCents: number;
    finalPriceCents: number;
    priceTtcCents: number;
    priceHtCents: number;
    vatCents: number;
    internalCostCents: number;
    fuelLiters: number;
    fuelCostCents: number;
  };
  minimumApplied: boolean;
  profitabilityApplied: boolean;
};

function billKm(km: number, precision: PricingConfig["distance"]["billingPrecision"]): number {
  if (km <= 0) return 0;
  if (precision === "ceil") return Math.ceil(Math.round(km * 1000) / 1000);
  return Math.round(km * 10) / 10;
}

export function createState(input: EngineInput, config: PricingConfig): PricingState {
  const loaded = input.legs.loaded;
  const km = {
    emptyOut: Math.max(0, input.legs.emptyOut.km),
    loaded: loaded ? Math.max(0, loaded.km) : 0,
    emptyBack: Math.max(0, input.legs.emptyBack.km),
    total: 0,
  };
  km.total = km.emptyOut + km.loaded + km.emptyBack;
  const minutes = {
    emptyOut: Math.max(0, input.legs.emptyOut.minutes),
    loaded: loaded ? Math.max(0, loaded.minutes) : 0,
    emptyBack: Math.max(0, input.legs.emptyBack.minutes),
    driving: 0,
    handling: Math.max(0, config.handlingMinutes),
  };
  minutes.driving = minutes.emptyOut + minutes.loaded + minutes.emptyBack;
  const precision = config.distance.billingPrecision;
  return {
    input,
    config,
    facts: { input, km },
    km,
    billedKm: {
      emptyOut: billKm(km.emptyOut, precision),
      loaded: billKm(km.loaded, precision),
      emptyBack: billKm(km.emptyBack, precision),
    },
    minutes,
    lines: [],
    warnings: [],
    hiddenReasons: [],
    t: {
      legsCents: 0,
      basePriceCents: 0,
      supplementsCents: 0,
      fullServiceCents: 0,
      surchargesCents: 0,
      discountsCents: 0,
      computedPriceCents: 0,
      roundedPriceCents: 0,
      finalPriceCents: 0,
      priceTtcCents: 0,
      priceHtCents: 0,
      vatCents: 0,
      internalCostCents: 0,
      fuelLiters: 0,
      fuelCostCents: 0,
    },
    minimumApplied: false,
    profitabilityApplied: false,
  };
}

/** Règles actives d'une étape : activées, du bon compte, conditions vérifiées, triées par priorité. */
export function activeRules(state: PricingState, categories: RuleCategory[], ledger: Ledger): PricingRule[] {
  return state.config.rules
    .filter(
      (rule) =>
        rule.enabled &&
        rule.ledger === ledger &&
        categories.includes(rule.category) &&
        matchesAll(rule.conditions, state.facts),
    )
    .sort((a, b) => a.priority - b.priority || a.code.localeCompare(b.code));
}

export function addWarning(state: PricingState, code: WarningCode, message: string): void {
  if (!state.warnings.some((w) => w.code === code && w.message === message)) {
    state.warnings.push({ code, message });
  }
}

export function hidePrice(state: PricingState, reason: HiddenReason): void {
  if (!state.hiddenReasons.includes(reason)) state.hiddenReasons.push(reason);
}

export function signOf(rule: PricingRule): 1 | -1 {
  return rule.effect === "subtract" ? -1 : 1;
}

/** Montant d'une règle fixe ou en pourcentage, avec son explication. */
export function fixedOrPercentAmount(
  rule: PricingRule,
  bases: { base_price: number; full_service: number; estimate: number },
): { amount: number; detail?: string } | null {
  const calc = rule.calculation;
  if (calc.kind === "fixed") {
    return { amount: signOf(rule) * calc.amountCents };
  }
  if (calc.kind === "percent") {
    const base = bases[calc.base];
    return {
      amount: signOf(rule) * percentOf(base, calc.rateBp),
      detail: `${formatPercentBp(calc.rateBp)} de ${formatEuros(base)}`,
    };
  }
  return null;
}

/** Explication d'un montant au kilomètre : « 45 km × 2,20 € (5 km offerts) ». */
export function perKmDetail(km: number, centsPerKm: number, freeKm: number): string {
  const free = freeKm > 0 ? ` (${formatKm(freeKm, 1)} offerts)` : "";
  return `${formatKm(km)} × ${formatEuros(centsPerKm)}${free}`;
}

export function perHourDetail(minutes: number, centsPerHour: number): string {
  return `${formatMinutes(minutes)} × ${formatEuros(centsPerHour)}/h`;
}

export function pushLine(state: PricingState, line: QuoteLine): void {
  state.lines.push(line);
}

/** Convertit un prix (dans l'unité de saisie TTC ou HT) en hors taxes. */
export function unitToHt(state: PricingState, unitCents: number): number {
  const { vat } = state.config;
  if (!vat.subject || !vat.pricesIncludeVat) return unitCents;
  return ttcToHt(unitCents, vat.rateBp);
}

/** Plus petit prix (unité de saisie) dont la valeur hors taxes atteint `htCents`. */
export function htToUnitCeil(state: PricingState, htCents: number): number {
  const { vat } = state.config;
  if (!vat.subject || !vat.pricesIncludeVat) return htCents;
  let unit = Math.ceil((htCents * (10_000 + vat.rateBp)) / 10_000);
  while (ttcToHt(unit, vat.rateBp) < htCents) unit += 1;
  return unit;
}

export function unitToTtc(state: PricingState, unitCents: number): number {
  const { vat } = state.config;
  if (!vat.subject || vat.pricesIncludeVat) return unitCents;
  return htToTtc(unitCents, vat.rateBp);
}

export { roundHalfAwayFromZero };
