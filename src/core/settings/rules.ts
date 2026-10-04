/**
 * Description des règles tarifaires pour l'administration : libellés, types de calcul autorisés,
 * bornes de saisie, validation et textes lisibles pour l'historique.
 */
import { z } from "zod";
import { isValidTime } from "@/core/calendar/paris";
import { formatEuros, formatPercentBp, WEEKDAY_LABELS } from "@/core/format";
import type {
  Calculation,
  Condition,
  PercentBase,
  PricingRule,
  RuleCategory,
  Situation,
  VehicleCategory,
} from "@/core/pricing/types";

export type RuleSection = "base" | "schedule" | "vehicles" | "situations" | "costs" | "discounts";

export type RuleCategoryMeta = {
  label: string;
  section: RuleSection;
  kinds: Calculation["kind"][];
  defaultPercentBase: PercentBase;
  /** L'administration peut ajouter des règles de cette catégorie. */
  canAdd: boolean;
};

export const RULE_CATEGORY_META: Record<RuleCategory, RuleCategoryMeta> = {
  fee: { label: "Forfait", section: "base", kinds: ["fixed"], defaultPercentBase: "base_price", canAdd: false },
  leg: { label: "Trajet", section: "base", kinds: ["per_km"], defaultPercentBase: "base_price", canAdd: false },
  fixed_fee: { label: "Frais fixe", section: "base", kinds: ["fixed"], defaultPercentBase: "base_price", canAdd: true },
  vehicle: { label: "Véhicule", section: "vehicles", kinds: ["fixed", "percent"], defaultPercentBase: "base_price", canAdd: true },
  situation: { label: "Situation", section: "situations", kinds: ["fixed", "percent"], defaultPercentBase: "base_price", canAdd: true },
  custom: { label: "Règle personnalisée", section: "situations", kinds: ["fixed", "percent"], defaultPercentBase: "base_price", canAdd: true },
  time_slot: { label: "Plage horaire", section: "schedule", kinds: ["fixed", "percent"], defaultPercentBase: "full_service", canAdd: true },
  day: { label: "Jour", section: "schedule", kinds: ["fixed", "percent"], defaultPercentBase: "full_service", canAdd: false },
  holiday: { label: "Jour férié", section: "schedule", kinds: ["fixed", "percent"], defaultPercentBase: "full_service", canAdd: false },
  discount: { label: "Remise", section: "discounts", kinds: ["fixed", "percent"], defaultPercentBase: "estimate", canAdd: true },
  internal_cost: { label: "Coût interne", section: "costs", kinds: ["per_km", "fixed", "per_hour", "fuel"], defaultPercentBase: "base_price", canAdd: true },
};

export const RULE_LIMITS = {
  amountCents: { min: 0, max: 500_000, softMax: 30_000 },
  rateBp: { min: 0, max: 50_000, softMax: 10_000 },
  centsPerKm: { min: 0, max: 5_000, softMax: 1_000 },
  centsPerHour: { min: 0, max: 50_000, softMax: 10_000 },
  freeKm: { min: 0, max: 500 },
} as const;

export const PERCENT_BASE_LABELS: Record<PercentBase, string> = {
  base_price: "du prix de base (forfait + trajets)",
  full_service: "de la prestation complète (avec suppléments)",
  estimate: "de l'estimation (avec majorations)",
};

/** « 45,00 € », « +25 % », « 2,20 €/km », « 25,00 €/h ». */
export function describeCalculation(calc: Calculation): string {
  switch (calc.kind) {
    case "fixed":
      return formatEuros(calc.amountCents);
    case "percent":
      return formatPercentBp(calc.rateBp);
    case "per_km":
      return `${formatEuros(calc.centsPerKm)}/km${calc.freeKm > 0 ? ` (${calc.freeKm} km offerts)` : ""}`;
    case "per_hour":
      return `${formatEuros(calc.centsPerHour)}/h`;
    case "fuel":
      return "Litres consommés × prix du carburant";
  }
}

export function describeCondition(condition: Condition): string {
  switch (condition.type) {
    case "time_between":
      return condition.start === condition.end ? "Toute la journée" : `De ${condition.start} à ${condition.end}`;
    case "weekday_in":
      return condition.days.map((d) => WEEKDAY_LABELS[d]).join(", ");
    case "public_holiday":
      return "Jour férié";
    case "vehicle_in":
      return `Véhicule : ${condition.categories.join(", ")}`;
    case "situation_any":
      return `Situation : ${condition.codes.join(", ")}`;
    case "distance":
      return `Distance ${condition.operator === "gt" ? "supérieure à" : "jusqu'à"} ${condition.km} km`;
    case "service_kind":
      return condition.kind === "tow" ? "Remorquage" : "Dépannage sur place";
    case "pickup_postcode_in":
      return `Codes postaux : ${condition.postcodes.join(", ")}`;
  }
}

export type RuleChange = { field: string; before: string; after: string };

/** Différences lisibles entre deux versions d'une règle (pour l'historique et la confirmation). */
export function diffRule(before: PricingRule, after: PricingRule): RuleChange[] {
  const changes: RuleChange[] = [];
  if (before.enabled !== after.enabled) {
    changes.push({ field: "État", before: before.enabled ? "Activé" : "Désactivé", after: after.enabled ? "Activé" : "Désactivé" });
  }
  const calcBefore = describeCalculation(before.calculation);
  const calcAfter = describeCalculation(after.calculation);
  if (calcBefore !== calcAfter) changes.push({ field: "Montant", before: calcBefore, after: calcAfter });
  if (
    before.calculation.kind === "percent" &&
    after.calculation.kind === "percent" &&
    before.calculation.base !== after.calculation.base
  ) {
    changes.push({
      field: "Calculé sur",
      before: PERCENT_BASE_LABELS[before.calculation.base],
      after: PERCENT_BASE_LABELS[after.calculation.base],
    });
  }
  if (before.calculation.kind === "per_hour" && after.calculation.kind === "per_hour" && before.calculation.includeHandling !== after.calculation.includeHandling) {
    changes.push({
      field: "Temps de chargement inclus",
      before: before.calculation.includeHandling ? "Oui" : "Non",
      after: after.calculation.includeHandling ? "Oui" : "Non",
    });
  }
  const condBefore = before.conditions.map(describeCondition).join(" · ");
  const condAfter = after.conditions.map(describeCondition).join(" · ");
  if (condBefore !== condAfter) changes.push({ field: "Quand", before: condBefore || "Toujours", after: condAfter || "Toujours" });
  if (before.label !== after.label) changes.push({ field: "Nom", before: before.label, after: after.label });
  if (before.clientVisible !== after.clientVisible || (before.clientLabel ?? "") !== (after.clientLabel ?? "")) {
    changes.push({
      field: "Affiché au client",
      before: before.clientVisible ? before.clientLabel || "Oui" : "Non",
      after: after.clientVisible ? after.clientLabel || "Oui" : "Non",
    });
  }
  if (before.priority !== after.priority) {
    changes.push({ field: "Ordre d'application", before: String(before.priority), after: String(after.priority) });
  }
  return changes;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const timeSchema = z.string().refine(isValidTime, { error: "Heure invalide (format 22:00)." });
const weekdaySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]);
const legKeySchema = z.enum(["emptyOut", "loaded", "emptyBack"]);

export const conditionSchema: z.ZodType<Condition> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("time_between"), start: timeSchema, end: timeSchema }),
  z.object({ type: z.literal("weekday_in"), days: z.array(weekdaySchema).min(1).max(7) }),
  z.object({ type: z.literal("public_holiday") }),
  z.object({ type: z.literal("vehicle_in"), categories: z.array(z.string().min(1).max(40)).min(1).max(20) }),
  z.object({ type: z.literal("situation_any"), codes: z.array(z.string().min(1).max(40)).min(1).max(20) }),
  z.object({ type: z.literal("distance"), leg: z.union([legKeySchema, z.literal("total")]), operator: z.enum(["gt", "lte"]), km: z.number().min(0).max(5000) }),
  z.object({ type: z.literal("service_kind"), kind: z.enum(["tow", "on_site"]) }),
  z.object({ type: z.literal("pickup_postcode_in"), postcodes: z.array(z.string().regex(/^\d{5}$/)).min(1).max(200) }),
]);

const L = RULE_LIMITS;
const intRange = (min: number, max: number, label: string) =>
  z.number().int({ error: `${label} : valeur invalide.` }).min(min, { error: `${label} : valeur trop basse.` }).max(max, { error: `${label} : valeur trop élevée.` });

export const calculationSchema: z.ZodType<Calculation> = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), amountCents: intRange(L.amountCents.min, L.amountCents.max, "Montant") }),
  z.object({
    kind: z.literal("percent"),
    rateBp: intRange(L.rateBp.min, L.rateBp.max, "Pourcentage"),
    base: z.enum(["base_price", "full_service", "estimate"]),
  }),
  z.object({
    kind: z.literal("per_km"),
    centsPerKm: intRange(L.centsPerKm.min, L.centsPerKm.max, "Prix au kilomètre"),
    legs: z.array(legKeySchema).min(1).max(3),
    freeKm: z.number().min(L.freeKm.min).max(L.freeKm.max),
  }),
  z.object({
    kind: z.literal("per_hour"),
    centsPerHour: intRange(L.centsPerHour.min, L.centsPerHour.max, "Prix horaire"),
    includeHandling: z.boolean(),
  }),
  z.object({ kind: z.literal("fuel") }),
]);

export const ruleDraftSchema = z.object({
  id: z.string().max(64).optional(),
  code: z.string().max(80).optional(),
  category: z.enum(["fee", "leg", "fixed_fee", "vehicle", "situation", "custom", "time_slot", "day", "holiday", "discount", "internal_cost"]),
  label: z.string().trim().min(2, { error: "Donnez un nom à la règle." }).max(80),
  help: z.string().max(300).nullable().optional(),
  enabled: z.boolean(),
  effect: z.enum(["add", "subtract"]),
  calculation: calculationSchema,
  conditions: z.array(conditionSchema).max(10),
  priority: z.number().int().min(0).max(10_000),
  clientVisible: z.boolean(),
  clientLabel: z.string().trim().max(80).nullable().optional(),
});

export type RuleDraft = z.infer<typeof ruleDraftSchema>;

/** Vérifie qu'une règle respecte les types de calcul autorisés pour sa catégorie. */
export function ruleKindError(rule: Pick<PricingRule, "category" | "calculation" | "label">): string | null {
  const meta = RULE_CATEGORY_META[rule.category];
  if (!meta.kinds.includes(rule.calculation.kind)) {
    return `« ${rule.label} » : ce type de calcul n'est pas possible pour une règle « ${meta.label} ».`;
  }
  return null;
}

/** Valeurs inhabituelles d'une règle (confirmation demandée, pas de blocage). */
export function ruleSoftWarning(rule: Pick<PricingRule, "calculation" | "label" | "category">): string | null {
  const calc = rule.calculation;
  if (calc.kind === "fixed" && calc.amountCents > L.amountCents.softMax) {
    return `« ${rule.label} » : ${formatEuros(calc.amountCents)} paraît très élevé. Confirmez-vous ?`;
  }
  if (calc.kind === "percent" && calc.rateBp > L.rateBp.softMax) {
    return `« ${rule.label} » : ${formatPercentBp(calc.rateBp)} paraît très élevé. Confirmez-vous ?`;
  }
  if (calc.kind === "per_km" && calc.centsPerKm > L.centsPerKm.softMax) {
    return `« ${rule.label} » : ${formatEuros(calc.centsPerKm)}/km paraît très élevé. Confirmez-vous ?`;
  }
  if (calc.kind === "per_hour" && calc.centsPerHour > L.centsPerHour.softMax) {
    return `« ${rule.label} » : ${formatEuros(calc.centsPerHour)}/h paraît très élevé. Confirmez-vous ?`;
  }
  return null;
}

export const vehicleDraftSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
  label: z.string().trim().min(2, { error: "Donnez un nom au véhicule." }).max(60),
  icon: z.string().max(30),
  sortOrder: z.number().int().min(0).max(10_000),
  clientVisible: z.boolean(),
  acceptance: z.enum(["accepted", "on_request", "refused"]),
  active: z.boolean(),
});

export const situationDraftSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
  label: z.string().trim().min(2, { error: "Donnez un nom à la situation." }).max(60),
  clientLabel: z.string().trim().min(2).max(60),
  icon: z.string().max(30),
  group: z.enum(["problem", "state", "detail"]),
  sortOrder: z.number().int().min(0).max(10_000),
  clientVisible: z.boolean(),
  onSitePossible: z.boolean(),
  active: z.boolean(),
});

export const VEHICLE_ACCEPTANCE_LABELS: Record<VehicleCategory["acceptance"], string> = {
  accepted: "Prix automatique",
  on_request: "Sur demande (je rappelle)",
  refused: "Non pris en charge",
};

export const SITUATION_GROUP_LABELS: Record<Situation["group"], string> = {
  problem: "Problème",
  state: "État du véhicule",
  detail: "Particularité",
};

/** Transforme un libellé en code interne stable : « Véhicule très bas » → « vehicule_tres_bas ». */
export function slugCode(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36) || "regle";
}
