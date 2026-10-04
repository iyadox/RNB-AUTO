/**
 * Photographie des tarifs : tout ce qui influence un prix, figé dans une version numérotée.
 * Une estimation référence sa version : un changement de tarif ne modifie jamais le passé.
 */
import type { HolidaysSettings } from "@/core/calendar/holidays";
import type { PricingConfig, PricingRule, Situation, VehicleCategory } from "@/core/pricing/types";
import type { AddressValue, SettingsValues } from "./registry";

export type ConfigSnapshot = {
  pricing: PricingConfig;
  depot: AddressValue;
  calendar: { referenceTime: "request" | "arrival"; holidays: HolidaysSettings };
  fuel: {
    mode: "manual" | "auto";
    manualPriceMillis: number;
    type: string;
    auto: { radiusKm: number; maxAgeHours: number; minPriceMillis: number; maxPriceMillis: number };
  };
  estimate: { enabled: boolean; validityMinutes: number; showSupplementLabels: boolean };
  routing: { optimization: "fastest" | "shortest" };
  regulatedRoads: { enabled: boolean; message: string };
};

export function buildPricingConfig(
  v: SettingsValues,
  rules: PricingRule[],
  vehicles: VehicleCategory[],
  situations: Situation[],
): PricingConfig {
  return {
    minimumPrice: { enabled: v["pricing.minimum.enabled"], amountCents: v["pricing.minimum.amountCents"] },
    rounding: {
      enabled: v["rounding.enabled"],
      stepCents: Number(v["rounding.step"]) * 100,
      mode: v["rounding.mode"],
      afterAdjustments: v["rounding.afterAdjustments"],
    },
    margin: {
      minimumCents: v["margin.minimumCents"],
      targetBp: v["margin.targetBp"],
      onlineBelowMinimum: v["margin.onlineBelowMinimum"],
    },
    vat: {
      subject: v["vat.subject"],
      rateBp: v["vat.rateBp"],
      pricesIncludeVat: v["vat.pricesInput"] === "ttc",
      fuelRecoverableBp: v["vat.fuelRecoverableBp"],
    },
    stacking: {
      days: v["pricing.stacking.days"],
      timeSlots: v["pricing.stacking.timeSlots"],
      combined: v["pricing.stacking.combined"],
    },
    distance: { billingPrecision: v["pricing.distance.billingPrecision"] },
    truck: {
      consumptionEmptyL100: v["truck.consumptionEmptyL100"],
      consumptionLoadedL100: v["truck.consumptionLoadedL100"],
    },
    fuelIndexation: {
      enabled: v["fuel.indexation.enabled"],
      referencePriceMillis: v["fuel.indexation.referencePriceMillis"],
      shareBp: v["fuel.indexation.shareBp"],
      capBp: v["fuel.indexation.capBp"],
    },
    handlingMinutes: v["costs.handlingMinutes"],
    zone: { maxApproachKm: v["zone.maxApproachKm"], maxTransportKm: v["zone.maxTransportKm"] },
    rules,
    vehicles,
    situations,
  };
}

export function buildSnapshot(
  v: SettingsValues,
  rules: PricingRule[],
  vehicles: VehicleCategory[],
  situations: Situation[],
): ConfigSnapshot {
  return {
    pricing: buildPricingConfig(v, rules, vehicles, situations),
    depot: v["company.depot"],
    calendar: {
      referenceTime: v["pricing.calendar.referenceTime"],
      holidays: { disabled: v["calendar.holidays.disabled"], custom: v["calendar.holidays.custom"] },
    },
    fuel: {
      mode: v["fuel.mode"],
      manualPriceMillis: v["fuel.manualPriceMillis"],
      type: v["fuel.type"],
      auto: {
        radiusKm: v["fuel.auto.radiusKm"],
        maxAgeHours: v["fuel.auto.maxAgeHours"],
        minPriceMillis: v["fuel.auto.minPriceMillis"],
        maxPriceMillis: v["fuel.auto.maxPriceMillis"],
      },
    },
    estimate: {
      enabled: v["estimate.enabled"],
      validityMinutes: v["estimate.validityMinutes"],
      showSupplementLabels: v["estimate.showSupplementLabels"],
    },
    routing: { optimization: v["routing.optimization"] },
    regulatedRoads: { enabled: v["zone.regulatedRoads.enabled"], message: v["zone.regulatedRoads.message"] },
  };
}

/** Empreinte stable d'un objet (clés triées), pour détecter qu'une version est identique. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
