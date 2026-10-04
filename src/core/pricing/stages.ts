/**
 * Étapes du calcul. Chacune lit l'état, ajoute ses lignes et met à jour les totaux.
 * L'ordre d'exécution est déclaré une seule fois, dans pipeline.ts.
 */
import { formatEuros, formatFuelPrice, formatLiters, formatPercentBp } from "@/core/format";
import { percentOf, roundHalfAwayFromZero, roundToStep, ttcToHt } from "@/core/money";
import {
  activeRules,
  addWarning,
  fixedOrPercentAmount,
  hidePrice,
  htToUnitCeil,
  perHourDetail,
  perKmDetail,
  pushLine,
  signOf,
  unitToHt,
  unitToTtc,
  type PricingState,
} from "./state";
import type { LegKey, PricingRule, StageId } from "./types";

export type Stage = { id: StageId; label: string; run: (state: PricingState) => void };

export function roundingLabel(stepCents: number, mode: "nearest" | "up"): string {
  const step = stepCents === 100 ? "à l'euro" : `aux ${stepCents / 100} €`;
  return `${step}, ${mode === "up" ? "toujours au-dessus" : "au plus proche"}`;
}

/** Vérifie que le prix peut être montré au client (véhicule accepté, distances dans la zone). */
export const eligibilityStage: Stage = {
  id: "eligibility",
  label: "Vérifications",
  run(state) {
    const { input, config } = state;
    const vehicle = config.vehicles.find((v) => v.code === input.vehicleCategory && v.active);
    if (!vehicle) {
      hidePrice(state, "vehicle_unknown");
      addWarning(state, "vehicle_unknown", `Type de véhicule inconnu (« ${input.vehicleCategory} »).`);
    } else if (vehicle.acceptance === "on_request") {
      hidePrice(state, "vehicle_on_request");
      addWarning(
        state,
        "vehicle_on_request",
        `« ${vehicle.label} » est réglé « sur demande » : le client ne voit pas de prix automatique.`,
      );
    } else if (vehicle.acceptance === "refused") {
      hidePrice(state, "vehicle_refused");
      addWarning(state, "vehicle_refused", `« ${vehicle.label} » n'est pas pris en charge.`);
    }
    for (const code of input.situations) {
      if (!config.situations.some((s) => s.code === code && s.active)) {
        addWarning(state, "situation_unknown", `Situation inconnue ignorée (« ${code} »).`);
      }
    }
    if (state.km.emptyOut > config.zone.maxApproachKm) {
      hidePrice(state, "out_of_zone_approach");
      addWarning(
        state,
        "out_of_zone_approach",
        `Client à ${state.km.emptyOut.toFixed(1).replace(".", ",")} km du dépôt : au-delà de la distance maximale (${config.zone.maxApproachKm} km) pour une estimation automatique.`,
      );
    }
    if (input.legs.loaded && state.km.loaded > config.zone.maxTransportKm) {
      hidePrice(state, "out_of_zone_transport");
      addWarning(
        state,
        "out_of_zone_transport",
        `Transport de ${state.km.loaded.toFixed(1).replace(".", ",")} km : au-delà de la distance maximale (${config.zone.maxTransportKm} km) pour une estimation automatique.`,
      );
    }
  },
};

function legsKm(state: PricingState, legs: LegKey[], source: "billed" | "real"): { km: number; present: boolean } {
  let km = 0;
  let present = false;
  for (const leg of legs) {
    if (leg === "loaded" && !state.input.legs.loaded) continue;
    present = true;
    km += source === "billed" ? state.billedKm[leg] : state.km[leg];
  }
  return { km: Math.round(km * 1000) / 1000, present };
}

/** Coûts internes : carburant, usure, amortissement, frais, temps. Jamais montrés au client. */
export const internalCostsStage: Stage = {
  id: "internal_costs",
  label: "Coût interne",
  run(state) {
    const { config, input } = state;
    let total = 0;
    for (const rule of activeRules(state, ["internal_cost"], "internal_cost")) {
      const calc = rule.calculation;
      let amount = 0;
      let detail: string | undefined;
      if (calc.kind === "fuel") {
        const emptyKm = state.km.emptyOut + state.km.emptyBack;
        const liters =
          (emptyKm * config.truck.consumptionEmptyL100 + state.km.loaded * config.truck.consumptionLoadedL100) / 100;
        const { vat } = config;
        let netMillis = input.fuelPriceTtcMillis;
        if (vat.subject) {
          const vatPart = (input.fuelPriceTtcMillis * vat.rateBp) / (10_000 + vat.rateBp);
          netMillis = input.fuelPriceTtcMillis - (vatPart * vat.fuelRecoverableBp) / 10_000;
        }
        amount = roundHalfAwayFromZero((liters * netMillis) / 10);
        detail = `${formatLiters(liters)} × ${formatFuelPrice(Math.round(netMillis))}${vat.subject && vat.fuelRecoverableBp > 0 ? " HT" : ""}`;
        state.t.fuelLiters = Math.round(liters * 1000) / 1000;
        state.t.fuelCostCents = amount;
      } else if (calc.kind === "per_km") {
        const { km, present } = legsKm(state, calc.legs, "real");
        if (!present) continue;
        const billable = Math.max(0, km - calc.freeKm);
        amount = roundHalfAwayFromZero(billable * calc.centsPerKm);
        detail = perKmDetail(billable, calc.centsPerKm, 0);
      } else if (calc.kind === "per_hour") {
        const minutes = state.minutes.driving + (calc.includeHandling ? state.minutes.handling : 0);
        amount = roundHalfAwayFromZero((minutes / 60) * calc.centsPerHour);
        detail = perHourDetail(minutes, calc.centsPerHour);
      } else if (calc.kind === "fixed") {
        amount = calc.amountCents;
      } else {
        continue;
      }
      amount *= signOf(rule);
      total += amount;
      pushLine(state, {
        stage: "internal_costs",
        kind: "cost",
        code: rule.code,
        ruleId: rule.id,
        label: rule.label,
        clientVisible: false,
        amountCents: amount,
        detail,
        ledger: "internal_cost",
      });
    }
    state.t.internalCostCents = total;
  },
};

/** ① ② ③ : prix au kilomètre de chaque trajet activé. */
export const legsStage: Stage = {
  id: "legs",
  label: "Trajets",
  run(state) {
    let total = 0;
    for (const rule of activeRules(state, ["leg"], "client_price")) {
      const calc = rule.calculation;
      let amount: number;
      let detail: string | undefined;
      if (calc.kind === "per_km") {
        const { km, present } = legsKm(state, calc.legs, "billed");
        if (!present) continue;
        const billable = Math.max(0, Math.round((km - calc.freeKm) * 1000) / 1000);
        amount = signOf(rule) * roundHalfAwayFromZero(billable * calc.centsPerKm);
        detail = perKmDetail(billable, calc.centsPerKm, calc.freeKm > 0 ? Math.min(calc.freeKm, km) : 0);
      } else if (calc.kind === "fixed") {
        amount = signOf(rule) * calc.amountCents;
      } else {
        continue;
      }
      total += amount;
      pushLine(state, {
        stage: "legs",
        kind: "leg",
        code: rule.code,
        ruleId: rule.id,
        label: rule.label,
        clientLabel: rule.clientLabel,
        clientVisible: rule.clientVisible,
        amountCents: amount,
        detail,
        ledger: "client_price",
      });
    }
    state.t.legsCents = total;
  },
};

/** Prix de base = forfaits de prise en charge + trajets + frais fixes. */
export const baseStage: Stage = {
  id: "base",
  label: "Prix de base",
  run(state) {
    let fees = 0;
    for (const rule of activeRules(state, ["fee", "fixed_fee"], "client_price")) {
      if (rule.calculation.kind !== "fixed") continue;
      const amount = signOf(rule) * rule.calculation.amountCents;
      fees += amount;
      pushLine(state, {
        stage: "base",
        kind: rule.category === "fee" ? "fee" : "fixed_fee",
        code: rule.code,
        ruleId: rule.id,
        label: rule.label,
        clientLabel: rule.clientLabel,
        clientVisible: rule.clientVisible,
        amountCents: amount,
        ledger: "client_price",
      });
    }
    state.t.basePriceCents = fees + state.t.legsCents;
  },
};

/** Indexation facultative de la part kilométrique sur le prix du carburant. */
export const fuelIndexationStage: Stage = {
  id: "fuel_indexation",
  label: "Impact du carburant",
  run(state) {
    const { fuelIndexation } = state.config;
    if (!fuelIndexation.enabled || fuelIndexation.referencePriceMillis <= 0 || state.t.legsCents === 0) return;
    const delta =
      (state.input.fuelPriceTtcMillis - fuelIndexation.referencePriceMillis) / fuelIndexation.referencePriceMillis;
    const raw = Math.round(fuelIndexation.shareBp * delta);
    const factorBp = Math.max(-fuelIndexation.capBp, Math.min(fuelIndexation.capBp, raw));
    if (factorBp === 0) return;
    const amount = percentOf(state.t.legsCents, factorBp);
    state.t.basePriceCents += amount;
    pushLine(state, {
      stage: "fuel_indexation",
      kind: "indexation",
      code: "fuel.indexation",
      label: "Impact du carburant",
      clientVisible: false,
      amountCents: amount,
      detail: `${factorBp > 0 ? "+" : "−"}${formatPercentBp(Math.abs(factorBp))} sur ${formatEuros(state.t.legsCents)} (carburant à ${formatFuelPrice(state.input.fuelPriceTtcMillis)}, référence ${formatFuelPrice(fuelIndexation.referencePriceMillis)})`,
      ledger: "client_price",
    });
  },
};

/** Suppléments : véhicule, situations, règles personnalisées. */
export const supplementsStage: Stage = {
  id: "supplements",
  label: "Suppléments",
  run(state) {
    let total = 0;
    const base = state.t.basePriceCents;
    for (const rule of activeRules(state, ["vehicle", "situation", "custom"], "client_price")) {
      const result = fixedOrPercentAmount(rule, { base_price: base, full_service: base, estimate: base });
      if (!result) continue;
      total += result.amount;
      pushLine(state, {
        stage: "supplements",
        kind: result.amount < 0 ? "discount" : "supplement",
        code: rule.code,
        ruleId: rule.id,
        label: rule.label,
        clientLabel: rule.clientLabel,
        clientVisible: rule.clientVisible,
        amountCents: result.amount,
        detail: result.detail,
        ledger: "client_price",
      });
    }
    state.t.supplementsCents = total;
    state.t.fullServiceCents = base + total;
  },
};

type CalendarCandidate = { rule: PricingRule; amount: number; detail?: string };

function sumOf(items: CalendarCandidate[]): number {
  return items.reduce((acc, item) => acc + item.amount, 0);
}

function pick(items: CalendarCandidate[], policy: "max" | "sum"): CalendarCandidate[] {
  if (policy === "sum" || items.length <= 1) return items;
  const best = items.reduce((a, b) => (b.amount > a.amount ? b : a));
  return [best];
}

/** Majorations de calendrier : plages horaires, jours, jours fériés, avec règles de cumul. */
export const calendarStage: Stage = {
  id: "calendar",
  label: "Majorations",
  run(state) {
    const { stacking } = state.config;
    const bases = {
      base_price: state.t.basePriceCents,
      full_service: state.t.fullServiceCents,
      estimate: state.t.fullServiceCents,
    };
    const days: CalendarCandidate[] = [];
    const slots: CalendarCandidate[] = [];
    const always: CalendarCandidate[] = [];
    for (const rule of activeRules(state, ["time_slot", "day", "holiday"], "client_price")) {
      const result = fixedOrPercentAmount(rule, bases);
      if (!result) continue;
      const candidate = { rule, amount: result.amount, detail: result.detail };
      if (rule.effect === "subtract") always.push(candidate);
      else if (rule.category === "time_slot") slots.push(candidate);
      else days.push(candidate);
    }
    let appliedDays = pick(days, stacking.days);
    let appliedSlots = pick(slots, stacking.timeSlots);
    if (stacking.combined === "max" && appliedDays.length > 0 && appliedSlots.length > 0) {
      if (sumOf(appliedDays) >= sumOf(appliedSlots)) appliedSlots = [];
      else appliedDays = [];
    }
    const applied = new Set([...appliedDays, ...appliedSlots, ...always]);
    let total = 0;
    for (const candidate of [...days, ...slots, ...always].sort(
      (a, b) => a.rule.priority - b.rule.priority || a.rule.code.localeCompare(b.rule.code),
    )) {
      const isApplied = applied.has(candidate);
      if (isApplied) total += candidate.amount;
      pushLine(state, {
        stage: "calendar",
        kind: candidate.amount < 0 ? "discount" : "surcharge",
        code: candidate.rule.code,
        ruleId: candidate.rule.id,
        label: candidate.rule.label,
        clientLabel: candidate.rule.clientLabel,
        clientVisible: candidate.rule.clientVisible && isApplied,
        amountCents: isApplied ? candidate.amount : 0,
        detail: isApplied
          ? candidate.detail
          : `Non cumulée : une majoration plus élevée s'applique déjà (${formatEuros(candidate.amount)})`,
        ledger: "client_price",
        informative: !isApplied,
      });
    }
    state.t.surchargesCents = total;
  },
};

/** Remises automatiques (clients professionnels, codes…), calculées sur l'estimation. */
export const discountsStage: Stage = {
  id: "discounts",
  label: "Remises",
  run(state) {
    const estimate = state.t.fullServiceCents + state.t.surchargesCents;
    let total = 0;
    for (const rule of activeRules(state, ["discount"], "client_price")) {
      const result = fixedOrPercentAmount(rule, {
        base_price: state.t.basePriceCents,
        full_service: state.t.fullServiceCents,
        estimate,
      });
      if (!result) continue;
      total += result.amount;
      pushLine(state, {
        stage: "discounts",
        kind: result.amount < 0 ? "discount" : "supplement",
        code: rule.code,
        ruleId: rule.id,
        label: rule.label,
        clientLabel: rule.clientLabel,
        clientVisible: rule.clientVisible,
        amountCents: result.amount,
        detail: result.detail,
        ledger: "client_price",
      });
    }
    state.t.discountsCents = total;
    state.t.computedPriceCents = Math.max(0, estimate + total);
  },
};

/** Arrondi du prix (avant le minimum, pour que le minimum soit respecté exactement). */
export const roundingStage: Stage = {
  id: "rounding",
  label: "Arrondi",
  run(state) {
    const { rounding } = state.config;
    const computed = state.t.computedPriceCents;
    if (!rounding.enabled || rounding.stepCents <= 1) {
      state.t.roundedPriceCents = computed;
      return;
    }
    const rounded = roundToStep(computed, rounding.stepCents, rounding.mode);
    state.t.roundedPriceCents = rounded;
    if (rounded !== computed) {
      pushLine(state, {
        stage: "rounding",
        kind: "rounding",
        code: "rounding",
        label: `Arrondi (${roundingLabel(rounding.stepCents, rounding.mode)})`,
        clientVisible: false,
        amountCents: rounded - computed,
        detail: `${formatEuros(computed)} → ${formatEuros(rounded)}`,
        ledger: "client_price",
      });
    }
  },
};

/** Prix minimum d'une intervention : le prix ne descend jamais en dessous. */
export const minimumStage: Stage = {
  id: "minimum",
  label: "Prix minimum",
  run(state) {
    const { minimumPrice } = state.config;
    const rounded = state.t.roundedPriceCents;
    if (minimumPrice.enabled && rounded < minimumPrice.amountCents) {
      state.t.finalPriceCents = minimumPrice.amountCents;
      state.minimumApplied = true;
      pushLine(state, {
        stage: "minimum",
        kind: "minimum",
        code: "minimum",
        label: "Prix minimum appliqué",
        clientVisible: false,
        amountCents: minimumPrice.amountCents - rounded,
        detail: `Calcul : ${formatEuros(rounded)} → minimum ${formatEuros(minimumPrice.amountCents)}`,
        ledger: "client_price",
      });
      addWarning(
        state,
        "minimum_applied",
        `Le prix minimum (${formatEuros(minimumPrice.amountCents)}) remplace le calcul (${formatEuros(rounded)}).`,
      );
    } else {
      state.t.finalPriceCents = rounded;
    }
  },
};

/** Garde-fou : une estimation en ligne ne doit pas être vendue sous la marge minimale. */
export const profitabilityStage: Stage = {
  id: "profitability",
  label: "Rentabilité",
  run(state) {
    const { margin, rounding } = state.config;
    const threshold = state.t.internalCostCents + margin.minimumCents;
    const priceHt = unitToHt(state, state.t.finalPriceCents);
    if (priceHt >= threshold || state.input.channel !== "online") return;
    if (margin.onlineBelowMinimum === "raise") {
      let required = htToUnitCeil(state, threshold);
      if (rounding.enabled && rounding.stepCents > 1) required = roundToStep(required, rounding.stepCents, "up");
      const raise = required - state.t.finalPriceCents;
      if (raise <= 0) return;
      state.t.finalPriceCents = required;
      state.profitabilityApplied = true;
      pushLine(state, {
        stage: "profitability",
        kind: "profitability",
        code: "profitability",
        label: "Ajustement de rentabilité",
        clientVisible: false,
        amountCents: raise,
        detail: `Pour couvrir le coût interne (${formatEuros(state.t.internalCostCents)}) + la marge minimale (${formatEuros(margin.minimumCents)}) HT`,
        ledger: "client_price",
      });
      addWarning(
        state,
        "profitability_raised",
        `Prix relevé de ${formatEuros(raise)} pour atteindre la marge minimale de ${formatEuros(margin.minimumCents)} HT.`,
      );
    } else if (margin.onlineBelowMinimum === "hide") {
      hidePrice(state, "not_profitable");
      addWarning(
        state,
        "not_profitable_hidden",
        "Marge minimale non atteinte : le client ne voit pas de prix et sera rappelé.",
      );
    }
  },
};

/** Prix TTC et HT. */
export const vatStage: Stage = {
  id: "vat",
  label: "TVA",
  run(state) {
    const { vat } = state.config;
    const final = state.t.finalPriceCents;
    if (!vat.subject) {
      state.t.priceTtcCents = final;
      state.t.priceHtCents = final;
      state.t.vatCents = 0;
      return;
    }
    state.t.priceTtcCents = unitToTtc(state, final);
    state.t.priceHtCents = vat.pricesIncludeVat ? ttcToHt(final, vat.rateBp) : final;
    state.t.vatCents = state.t.priceTtcCents - state.t.priceHtCents;
  },
};
