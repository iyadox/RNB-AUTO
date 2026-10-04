/**
 * Réglages FICTIFS utilisés uniquement par les tests (ceux de l'exemple du document 03).
 * Ce ne sont pas les tarifs de RNB AUTO.
 */
import type { Calculation, Condition, EngineInput, PricingConfig, PricingRule, RuleCategory } from "./types";

let counter = 0;

export function rule(
  code: string,
  category: RuleCategory,
  calculation: Calculation,
  options: Partial<Omit<PricingRule, "code" | "category" | "calculation">> & { conditions?: Condition[] } = {},
): PricingRule {
  counter += 1;
  return {
    id: `test-${counter}`,
    code,
    label: options.label ?? code,
    category,
    ledger: category === "internal_cost" ? "internal_cost" : "client_price",
    enabled: true,
    effect: "add",
    calculation,
    conditions: [],
    priority: counter * 10,
    clientVisible: category !== "internal_cost",
    clientLabel: options.clientLabel ?? options.label ?? code,
    system: true,
    ...options,
  };
}

export function docExampleConfig(overrides: Partial<PricingConfig> = {}): PricingConfig {
  return {
    minimumPrice: { enabled: true, amountCents: 4500 },
    rounding: { enabled: true, stepCents: 500, mode: "up", afterAdjustments: true },
    margin: { minimumCents: 500, targetBp: 3000, onlineBelowMinimum: "raise" },
    vat: { subject: true, rateBp: 2000, pricesIncludeVat: true, fuelRecoverableBp: 10_000 },
    stacking: { days: "max", timeSlots: "max", combined: "sum" },
    distance: { billingPrecision: "tenth" },
    truck: { consumptionEmptyL100: 14, consumptionLoadedL100: 17 },
    fuelIndexation: { enabled: false, referencePriceMillis: 1800, shareBp: 3000, capBp: 1000 },
    handlingMinutes: 30,
    zone: { maxApproachKm: 80, maxTransportKm: 150 },
    vehicles: [
      { code: "berline", label: "Berline", icon: "sedan", sortOrder: 1, clientVisible: true, acceptance: "accepted", active: true },
      { code: "suv", label: "SUV", icon: "suv", sortOrder: 2, clientVisible: true, acceptance: "accepted", active: true },
      { code: "grand_fourgon", label: "Grand fourgon", icon: "van", sortOrder: 3, clientVisible: true, acceptance: "on_request", active: true },
    ],
    situations: [
      { code: "battery", label: "Batterie", clientLabel: "Batterie", icon: "battery", group: "problem", sortOrder: 1, clientVisible: true, onSitePossible: true, active: true },
      { code: "non_rolling", label: "Véhicule non roulant", clientLabel: "Non roulant", icon: "stop", group: "state", sortOrder: 2, clientVisible: true, onSitePossible: false, active: true },
    ],
    rules: [
      rule("fee.pickup", "fee", { kind: "fixed", amountCents: 3000 }, { label: "Prise en charge" }),
      rule("leg.empty_out", "leg", { kind: "per_km", centsPerKm: 100, legs: ["emptyOut"], freeKm: 0 }, { label: "Déplacement jusqu'au client" }),
      rule("leg.loaded", "leg", { kind: "per_km", centsPerKm: 200, legs: ["loaded"], freeKm: 0 }, { label: "Trajet avec véhicule chargé" }),
      rule("leg.empty_back", "leg", { kind: "per_km", centsPerKm: 50, legs: ["emptyBack"], freeKm: 0 }, { label: "Retour au dépôt" }),
      rule("vehicle.suv", "vehicle", { kind: "fixed", amountCents: 1000 }, { label: "Supplément SUV", conditions: [{ type: "vehicle_in", categories: ["suv"] }] }),
      rule("situation.non_rolling", "situation", { kind: "fixed", amountCents: 2000 }, { label: "Véhicule non roulant", conditions: [{ type: "situation_any", codes: ["non_rolling"] }] }),
      rule("calendar.night", "time_slot", { kind: "percent", rateBp: 2000, base: "full_service" }, { label: "Majoration nuit", conditions: [{ type: "time_between", start: "22:00", end: "06:00" }] }),
      rule("calendar.sunday", "day", { kind: "percent", rateBp: 2000, base: "full_service" }, { label: "Majoration dimanche", conditions: [{ type: "weekday_in", days: [7] }] }),
      rule("calendar.holiday", "holiday", { kind: "percent", rateBp: 2500, base: "full_service" }, { label: "Majoration jour férié", conditions: [{ type: "public_holiday" }] }),
      rule("cost.fuel", "internal_cost", { kind: "fuel" }, { label: "Carburant" }),
      rule("cost.wear", "internal_cost", { kind: "per_km", centsPerKm: 15, legs: ["emptyOut", "loaded", "emptyBack"], freeKm: 0 }, { label: "Usure et entretien" }),
      rule("cost.depreciation", "internal_cost", { kind: "per_km", centsPerKm: 10, legs: ["emptyOut", "loaded", "emptyBack"], freeKm: 0 }, { label: "Amortissement" }),
      rule("cost.overhead", "internal_cost", { kind: "fixed", amountCents: 500 }, { label: "Frais par intervention" }),
      rule("cost.labor", "internal_cost", { kind: "per_hour", centsPerHour: 2500, includeHandling: true }, { label: "Temps" }),
    ],
    ...overrides,
  };
}

/** Exemple 1 du document 03 : dimanche 23:00, SUV non roulant, Cergy → Montreuil. */
export function cergyMontreuilInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    serviceKind: "tow",
    vehicleCategory: "suv",
    situations: ["non_rolling"],
    legs: {
      emptyOut: { km: 38, minutes: 40 },
      loaded: { km: 45, minutes: 50 },
      emptyBack: { km: 8, minutes: 15 },
    },
    local: { isoWeekday: 7, time: "23:00", publicHoliday: null },
    fuelPriceTtcMillis: 1800,
    channel: "admin",
    ...overrides,
  };
}

/** Exemple 2 du document 03 : mardi 10:00, batterie à Drancy, sans transport. */
export function drancyBatteryInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    serviceKind: "on_site",
    vehicleCategory: "berline",
    situations: ["battery"],
    legs: {
      emptyOut: { km: 4, minutes: 10 },
      loaded: null,
      emptyBack: { km: 4, minutes: 10 },
    },
    local: { isoWeekday: 2, time: "10:00", publicHoliday: null },
    fuelPriceTtcMillis: 1800,
    channel: "admin",
    ...overrides,
  };
}
