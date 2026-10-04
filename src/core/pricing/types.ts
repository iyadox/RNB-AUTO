/**
 * Types du moteur tarifaire.
 * Le moteur est une fonction pure : il reçoit tout en entrée (choix, distances, prix du carburant,
 * réglages) et ne lit jamais la base de données ni le réseau. Il ne contient aucune valeur commerciale.
 */
import type { IsoWeekday } from "@/core/calendar/paris";

export type { IsoWeekday };

export type LegKey = "emptyOut" | "loaded" | "emptyBack";
export const LEG_KEYS: readonly LegKey[] = ["emptyOut", "loaded", "emptyBack"];

/** Remorquage (le véhicule est transporté) ou dépannage sur place (pas de trajet chargé). */
export type ServiceKind = "tow" | "on_site";

export type Leg = { km: number; minutes: number };

/** ① dépôt → client (à vide) · ② client → destination (chargé) · ③ destination → dépôt (à vide). */
export type Legs = { emptyOut: Leg; loaded: Leg | null; emptyBack: Leg };

export type EngineInput = {
  serviceKind: ServiceKind;
  vehicleCategory: string;
  situations: string[];
  legs: Legs;
  /** Moment pris en compte pour les majorations, à l'heure de Paris. */
  local: { isoWeekday: IsoWeekday; time: string; publicHoliday: string | null };
  /** Prix du litre TTC en millièmes d'euro (1,829 €/L → 1829). */
  fuelPriceTtcMillis: number;
  /** « online » : estimation affichée au client ; « admin » : calcul dans l'espace RNB AUTO. */
  channel: "online" | "admin";
  pickupPostcode?: string | null;
};

export type RuleCategory =
  | "fee" // forfait de prise en charge
  | "leg" // prix au kilomètre d'un trajet
  | "fixed_fee" // frais fixes
  | "vehicle" // supplément selon le véhicule
  | "situation" // supplément selon la situation
  | "custom" // règle personnalisée
  | "time_slot" // plage horaire (nuit…)
  | "day" // jour de la semaine
  | "holiday" // jour férié
  | "discount" // remise automatique
  | "internal_cost"; // coût interne (jamais montré au client)

export type Ledger = "client_price" | "internal_cost";

/** Montant sur lequel s'applique un pourcentage. */
export type PercentBase = "base_price" | "full_service" | "estimate";

export type Calculation =
  | { kind: "fixed"; amountCents: number }
  | { kind: "percent"; rateBp: number; base: PercentBase }
  | { kind: "per_km"; centsPerKm: number; legs: LegKey[]; freeKm: number }
  | { kind: "per_hour"; centsPerHour: number; includeHandling: boolean }
  | { kind: "fuel" };

/** Conditions d'une liste fermée : pas de formule libre, pas de code exécuté. */
export type Condition =
  | { type: "time_between"; start: string; end: string }
  | { type: "weekday_in"; days: IsoWeekday[] }
  | { type: "public_holiday" }
  | { type: "vehicle_in"; categories: string[] }
  | { type: "situation_any"; codes: string[] }
  | { type: "distance"; leg: LegKey | "total"; operator: "gt" | "lte"; km: number }
  | { type: "service_kind"; kind: ServiceKind }
  | { type: "pickup_postcode_in"; postcodes: string[] };

export type PricingRule = {
  id: string;
  code: string;
  label: string;
  help?: string | null;
  category: RuleCategory;
  ledger: Ledger;
  enabled: boolean;
  effect: "add" | "subtract";
  calculation: Calculation;
  /** Toutes doivent être vraies ; une liste vide signifie « toujours ». */
  conditions: Condition[];
  /** Ordre à l'intérieur de son étape (plus petit = plus tôt). */
  priority: number;
  clientVisible: boolean;
  clientLabel?: string | null;
  /** Règle fournie avec le système : désactivable, pas supprimable. */
  system: boolean;
};

export type VehicleAcceptance = "accepted" | "on_request" | "refused";

export type VehicleCategory = {
  code: string;
  label: string;
  icon: string;
  sortOrder: number;
  clientVisible: boolean;
  acceptance: VehicleAcceptance;
  active: boolean;
};

export type SituationGroup = "problem" | "state" | "detail";

export type Situation = {
  code: string;
  label: string;
  clientLabel: string;
  icon: string;
  group: SituationGroup;
  sortOrder: number;
  clientVisible: boolean;
  /** Le problème peut se régler sur place (batterie, crevaison…). */
  onSitePossible: boolean;
  active: boolean;
};

export type StackingPolicy = "max" | "sum";

/** Tout ce que lit le moteur. Construit à partir de la base, jamais écrit dans le code. */
export type PricingConfig = {
  minimumPrice: { enabled: boolean; amountCents: number };
  rounding: { enabled: boolean; stepCents: number; mode: "nearest" | "up"; afterAdjustments: boolean };
  margin: { minimumCents: number; targetBp: number; onlineBelowMinimum: "raise" | "warn" | "hide" };
  vat: { subject: boolean; rateBp: number; pricesIncludeVat: boolean; fuelRecoverableBp: number };
  stacking: { days: StackingPolicy; timeSlots: StackingPolicy; combined: StackingPolicy };
  distance: { billingPrecision: "tenth" | "ceil" };
  truck: { consumptionEmptyL100: number; consumptionLoadedL100: number };
  fuelIndexation: { enabled: boolean; referencePriceMillis: number; shareBp: number; capBp: number };
  handlingMinutes: number;
  zone: { maxApproachKm: number; maxTransportKm: number };
  rules: PricingRule[];
  vehicles: VehicleCategory[];
  situations: Situation[];
};

export type StageId =
  | "eligibility"
  | "internal_costs"
  | "legs"
  | "base"
  | "fuel_indexation"
  | "supplements"
  | "calendar"
  | "discounts"
  | "rounding"
  | "minimum"
  | "profitability"
  | "vat"
  | "adjustments";

export type LineKind =
  | "fee"
  | "leg"
  | "fixed_fee"
  | "indexation"
  | "supplement"
  | "surcharge"
  | "discount"
  | "rounding"
  | "minimum"
  | "profitability"
  | "adjustment"
  | "cost";

export type QuoteLine = {
  stage: StageId;
  kind: LineKind;
  code: string;
  ruleId?: string;
  /** Libellé affiché dans l'administration. */
  label: string;
  /** Libellé affiché au client (si la ligne lui est visible). */
  clientLabel?: string | null;
  clientVisible: boolean;
  amountCents: number;
  /** Explication du calcul : « 45 km × 2,20 € ». */
  detail?: string;
  ledger: Ledger;
  /** Ligne présente pour information (ex. majoration non cumulée). */
  informative?: boolean;
};

/** Raisons pour lesquelles le client ne voit pas de prix automatique. */
export type HiddenReason =
  | "vehicle_on_request"
  | "vehicle_refused"
  | "vehicle_unknown"
  | "out_of_zone_approach"
  | "out_of_zone_transport"
  | "not_profitable";

export type WarningCode =
  | "vehicle_on_request"
  | "vehicle_refused"
  | "vehicle_unknown"
  | "situation_unknown"
  | "out_of_zone_approach"
  | "out_of_zone_transport"
  | "minimum_applied"
  | "profitability_raised"
  | "not_profitable_hidden"
  | "margin_below_target"
  | "margin_below_minimum"
  | "loss"
  | "below_minimum_price";

export type Warning = { code: WarningCode; message: string };

export type MarginLevel = "ok" | "below_target" | "below_minimum" | "loss";

export type QuoteTotals = {
  legsCents: number;
  basePriceCents: number;
  supplementsCents: number;
  fullServiceCents: number;
  surchargesCents: number;
  discountsCents: number;
  /** Prix calculé, avant arrondi. */
  computedPriceCents: number;
  roundedPriceCents: number;
  /** Prix après minimum et rentabilité, dans l'unité de saisie (TTC ou HT). */
  finalPriceCents: number;
  priceTtcCents: number;
  priceHtCents: number;
  vatCents: number;
  internalCostCents: number;
  fuelLiters: number;
  fuelCostCents: number;
  marginCents: number;
  marginRateBp: number;
  marginLevel: MarginLevel;
};

export type QuoteResult = {
  engineVersion: string;
  lines: QuoteLine[];
  totals: QuoteTotals;
  km: { emptyOut: number; loaded: number; emptyBack: number; total: number };
  billedKm: { emptyOut: number; loaded: number; emptyBack: number };
  minutes: { emptyOut: number; loaded: number; emptyBack: number; driving: number; handling: number };
  flags: { minimumApplied: boolean; profitabilityApplied: boolean; hiddenReasons: HiddenReason[] };
  warnings: Warning[];
  /** Seule partie envoyée au navigateur du client. */
  client: {
    priceTtcCents: number | null;
    includedLabels: string[];
    vehicleTripKm: number | null;
    approachKm: number;
  };
};

export type ManualAdjustment = {
  effect: "supplement" | "discount";
  mode: "amount" | "percent";
  /** Centimes (mode « amount ») ou points de base (mode « percent »). */
  value: number;
  reason: string;
};

export type AdjustedPrice = {
  lines: QuoteLine[];
  startCents: number;
  adjustmentsCents: number;
  beforeRoundingCents: number;
  finalPriceCents: number;
  priceTtcCents: number;
  priceHtCents: number;
  marginCents: number;
  marginRateBp: number;
  marginLevel: MarginLevel;
  warnings: Warning[];
};
