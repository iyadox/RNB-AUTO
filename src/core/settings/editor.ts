/**
 * Éditeur des tarifs (« Mes tarifs ») : format du brouillon échangé avec l'administration,
 * application des modifications EN MÉMOIRE (validation, différences lisibles) — sans base.
 * Le serveur s'en sert pour l'aperçu d'impact puis pour l'enregistrement.
 */
import { z } from "zod";
import type { PercentBase, PricingRule, RuleCategory, Situation, VehicleCategory } from "@/core/pricing/types";
import { SECTIONS, SETTING_KEYS, SETTINGS, type SettingKey, type SettingsValues } from "./registry";
import {
  calculationSchema,
  conditionSchema,
  diffRule,
  describeCalculation,
  RULE_CATEGORY_META,
  ruleKindError,
  ruleSoftWarning,
  SITUATION_GROUP_LABELS,
  slugCode,
  VEHICLE_ACCEPTANCE_LABELS,
} from "./rules";
import { displaySettingValue, schemaFor, softLimitWarning } from "./validation";

export type SupplementDraft = { mode: "none" | "fixed" | "percent"; amountCents: number; rateBp: number };

export type VehicleDraft = VehicleCategory & { isNew?: boolean; tempId?: string; supplement: SupplementDraft };
export type SituationDraft = Situation & { isNew?: boolean; tempId?: string; supplement: SupplementDraft };
export type RuleDraftItem = PricingRule & { isNew?: boolean; archived?: boolean };

export type PricingDraft = {
  settings: Partial<Record<SettingKey, unknown>>;
  /** Règles éditées directement (forfaits, trajets, horaires, jours, coûts…), hors véhicules et situations. */
  rules: RuleDraftItem[];
  vehicles: VehicleDraft[];
  situations: SituationDraft[];
};

export type CurrentPricingState = {
  values: SettingsValues;
  rules: PricingRule[];
  vehicles: VehicleCategory[];
  situations: Situation[];
};

export type ChangeEntry = {
  entityType: "setting" | "rule" | "vehicle" | "situation";
  entityId: string;
  field: string;
  label: string;
  before: string;
  after: string;
  oldValue: unknown;
  newValue: unknown;
};

export type AppliedDraft = {
  errors: Record<string, string>;
  softWarnings: string[];
  changes: ChangeEntry[];
  next: CurrentPricingState;
  settingWrites: { key: SettingKey; value: unknown }[];
  ruleUpdates: PricingRule[];
  ruleInserts: PricingRule[];
  ruleArchives: PricingRule[];
  vehicleUpdates: VehicleCategory[];
  vehicleInserts: VehicleCategory[];
  situationUpdates: Situation[];
  situationInserts: Situation[];
};

/** Réglages modifiables depuis « Mes tarifs ». */
export const PRICING_SETTING_KEYS: SettingKey[] = SETTING_KEYS.filter((key) => SECTIONS[SETTINGS[key].section].area === "pricing");

/** Catégories de règles modifiées directement (les véhicules et situations ont leur propre écran). */
export const DIRECT_RULE_CATEGORIES: RuleCategory[] = ["fee", "leg", "fixed_fee", "time_slot", "day", "holiday", "internal_cost", "discount", "custom"];

const SUPPLEMENT_BASE: PercentBase = "base_price";

export function ruleToSupplement(rule: PricingRule | undefined): SupplementDraft {
  if (!rule) return { mode: "none", amountCents: 0, rateBp: 0 };
  const amountCents = rule.calculation.kind === "fixed" ? rule.calculation.amountCents : 0;
  const rateBp = rule.calculation.kind === "percent" ? rule.calculation.rateBp : 0;
  if (!rule.enabled) return { mode: "none", amountCents, rateBp };
  return { mode: rule.calculation.kind === "percent" ? "percent" : "fixed", amountCents, rateBp };
}

function applySupplement(rule: PricingRule, supplement: SupplementDraft): PricingRule {
  if (supplement.mode === "none") return { ...rule, enabled: false };
  if (supplement.mode === "fixed") return { ...rule, enabled: true, calculation: { kind: "fixed", amountCents: supplement.amountCents } };
  return { ...rule, enabled: true, calculation: { kind: "percent", rateBp: supplement.rateBp, base: SUPPLEMENT_BASE } };
}

function describeSupplement(supplement: SupplementDraft): string {
  if (supplement.mode === "none") return "Aucun";
  return describeCalculation(
    supplement.mode === "fixed"
      ? { kind: "fixed", amountCents: supplement.amountCents }
      : { kind: "percent", rateBp: supplement.rateBp, base: SUPPLEMENT_BASE },
  );
}

export function toDraft(state: CurrentPricingState): PricingDraft {
  const ruleByCode = new Map(state.rules.map((rule) => [rule.code, rule]));
  return {
    settings: Object.fromEntries(PRICING_SETTING_KEYS.map((key) => [key, structuredClone(state.values[key])])),
    rules: state.rules.filter((rule) => DIRECT_RULE_CATEGORIES.includes(rule.category)).map((rule) => structuredClone(rule)),
    vehicles: state.vehicles.map((vehicle) => ({ ...vehicle, supplement: ruleToSupplement(ruleByCode.get(`vehicle.${vehicle.code}`)) })),
    situations: state.situations.map((situation) => ({
      ...situation,
      supplement: ruleToSupplement(ruleByCode.get(`situation.${situation.code}`)),
    })),
  };
}

function uniqueCode(base: string, taken: Set<string>): string {
  let code = base;
  let index = 2;
  while (taken.has(code)) code = `${base}_${index++}`;
  taken.add(code);
  return code;
}

const CODE_PREFIX: Partial<Record<RuleCategory, string>> = {
  fixed_fee: "fee.extra",
  time_slot: "calendar.slot",
  internal_cost: "cost.extra",
  discount: "discount",
  custom: "custom",
};

let tempCounter = 0;
function tempId(): string {
  tempCounter += 1;
  return `nouveau-${Date.now().toString(36)}-${tempCounter}`;
}

function supplementRuleFor(
  kind: "vehicle" | "situation",
  item: { code: string; label: string },
  priority: number,
): PricingRule {
  return {
    id: tempId(),
    code: `${kind}.${item.code}`,
    label: kind === "vehicle" ? `Supplément ${item.label}` : item.label,
    help: null,
    category: kind,
    ledger: "client_price",
    enabled: false,
    effect: "add",
    calculation: { kind: "fixed", amountCents: 0 },
    conditions: [kind === "vehicle" ? { type: "vehicle_in", categories: [item.code] } : { type: "situation_any", codes: [item.code] }],
    priority,
    clientVisible: true,
    clientLabel: kind === "vehicle" ? `Supplément ${item.label}` : item.label,
    system: false,
  };
}

/** Applique un brouillon sur l'état actuel, en mémoire, avec validation complète. */
export function applyDraft(current: CurrentPricingState, draft: PricingDraft): AppliedDraft {
  const errors: Record<string, string> = {};
  const softWarnings: string[] = [];
  const changes: ChangeEntry[] = [];
  const values = structuredClone(current.values) as SettingsValues;
  const settingWrites: AppliedDraft["settingWrites"] = [];

  // ─── Réglages ─────────────────────────────────────────────────────────────
  for (const [key, raw] of Object.entries(draft.settings ?? {})) {
    if (!PRICING_SETTING_KEYS.includes(key as SettingKey)) {
      errors[`setting:${key}`] = "Ce réglage ne se modifie pas ici.";
      continue;
    }
    const settingKey = key as SettingKey;
    const parsed = schemaFor(settingKey).safeParse(raw);
    if (!parsed.success) {
      errors[`setting:${key}`] = parsed.error.issues[0]?.message ?? "Valeur invalide.";
      continue;
    }
    const before = current.values[settingKey];
    if (JSON.stringify(before) === JSON.stringify(parsed.data)) continue;
    (values as Record<string, unknown>)[settingKey] = parsed.data;
    settingWrites.push({ key: settingKey, value: parsed.data });
    const warning = softLimitWarning(settingKey, parsed.data);
    if (warning) softWarnings.push(warning);
    changes.push({
      entityType: "setting",
      entityId: settingKey,
      field: settingKey,
      label: `${SECTIONS[SETTINGS[settingKey].section].label} — ${SETTINGS[settingKey].label}`,
      before: displaySettingValue(settingKey, before),
      after: displaySettingValue(settingKey, parsed.data),
      oldValue: before,
      newValue: parsed.data,
    });
  }

  // ─── Règles éditées directement ───────────────────────────────────────────
  const rules = current.rules.map((rule) => structuredClone(rule));
  const ruleIndex = new Map(rules.map((rule, index) => [rule.id, index]));
  const takenCodes = new Set(rules.map((rule) => rule.code));
  const ruleUpdates: PricingRule[] = [];
  const ruleInserts: PricingRule[] = [];
  const ruleArchives: PricingRule[] = [];

  for (const item of draft.rules ?? []) {
    const errorKey = `rule:${item.id ?? item.code}`;
    const label = String(item.label ?? "").trim();
    if (label.length < 2 || label.length > 80) {
      errors[errorKey] = "Donnez un nom à la règle (2 à 80 caractères).";
      continue;
    }
    const calc = calculationSchema.safeParse(item.calculation);
    if (!calc.success) {
      errors[errorKey] = `« ${label} » : ${calc.error.issues[0]?.message ?? "montant invalide"}.`;
      continue;
    }

    if (item.isNew) {
      const meta = RULE_CATEGORY_META[item.category];
      if (!meta?.canAdd || !DIRECT_RULE_CATEGORIES.includes(item.category)) {
        errors[errorKey] = "Ce type de règle ne peut pas être ajouté.";
        continue;
      }
      const conditions = item.category === "time_slot" ? item.conditions.filter((c) => c.type === "time_between") : [];
      if (item.category === "time_slot" && conditions.length !== 1) {
        errors[errorKey] = `« ${label} » : indiquez les heures de début et de fin.`;
        continue;
      }
      const validConditions = conditions.every((c) => conditionSchema.safeParse(c).success);
      if (!validConditions) {
        errors[errorKey] = `« ${label} » : heures invalides.`;
        continue;
      }
      const rule: PricingRule = {
        id: tempId(),
        code: uniqueCode(`${CODE_PREFIX[item.category] ?? "custom"}.${slugCode(label)}`, takenCodes),
        label,
        help: null,
        category: item.category,
        ledger: item.category === "internal_cost" ? "internal_cost" : "client_price",
        enabled: Boolean(item.enabled),
        effect: item.category === "discount" ? "subtract" : "add",
        calculation: calc.data,
        conditions,
        priority: Math.max(0, ...rules.filter((r) => r.category === item.category).map((r) => r.priority)) + 1,
        clientVisible: item.category !== "internal_cost" && Boolean(item.clientVisible ?? true),
        clientLabel: item.category !== "internal_cost" ? label : null,
        system: false,
      };
      const kindError = ruleKindError(rule);
      if (kindError) {
        errors[errorKey] = kindError;
        continue;
      }
      if (item.archived) continue;
      const warning = ruleSoftWarning(rule);
      if (warning) softWarnings.push(warning);
      rules.push(rule);
      ruleInserts.push(rule);
      changes.push({
        entityType: "rule",
        entityId: rule.code,
        field: "création",
        label: `Nouvelle règle « ${rule.label} »`,
        before: "—",
        after: `${describeCalculation(rule.calculation)}${rule.enabled ? "" : " (désactivée)"}`,
        oldValue: null,
        newValue: rule,
      });
      continue;
    }

    const index = ruleIndex.get(item.id);
    if (index === undefined) {
      errors[errorKey] = "Règle introuvable : rechargez la page.";
      continue;
    }
    const before = rules[index] as PricingRule;
    if (!DIRECT_RULE_CATEGORIES.includes(before.category)) continue;

    if (item.archived) {
      if (before.system) {
        errors[errorKey] = `« ${before.label} » ne peut pas être supprimée : désactivez-la.`;
        continue;
      }
      ruleArchives.push(before);
      rules.splice(index, 1);
      ruleIndex.clear();
      rules.forEach((rule, i) => ruleIndex.set(rule.id, i));
      changes.push({
        entityType: "rule",
        entityId: before.code,
        field: "suppression",
        label: `Règle « ${before.label} » supprimée`,
        before: describeCalculation(before.calculation),
        after: "—",
        oldValue: before,
        newValue: null,
      });
      continue;
    }

    // Les éléments structurels (code, catégorie, trajets concernés, conditions) restent ceux du système.
    let calculation = calc.data;
    if (before.calculation.kind === "per_km" && calculation.kind === "per_km") {
      calculation = { ...calculation, legs: before.calculation.legs };
    }
    if (before.calculation.kind !== calculation.kind) {
      const switchable =
        (before.calculation.kind === "fixed" || before.calculation.kind === "percent") &&
        (calculation.kind === "fixed" || calculation.kind === "percent");
      if (!switchable) {
        errors[errorKey] = `« ${before.label} » : ce type de calcul ne peut pas être changé.`;
        continue;
      }
    }
    let conditions = before.conditions;
    if (before.category === "time_slot") {
      const range = item.conditions.find((c) => c.type === "time_between");
      if (!range || !conditionSchema.safeParse(range).success) {
        errors[errorKey] = `« ${before.label} » : heures invalides.`;
        continue;
      }
      conditions = [range, ...before.conditions.filter((c) => c.type !== "time_between")];
    }
    const updated: PricingRule = {
      ...before,
      label,
      enabled: Boolean(item.enabled),
      calculation,
      conditions,
      priority: Number.isInteger(item.priority) && item.priority >= 0 && item.priority <= 10_000 ? item.priority : before.priority,
      clientVisible: before.ledger === "internal_cost" ? false : Boolean(item.clientVisible),
      clientLabel: before.ledger === "internal_cost" ? null : (String(item.clientLabel ?? "").trim() || label),
    };
    const kindError = ruleKindError(updated);
    if (kindError) {
      errors[errorKey] = kindError;
      continue;
    }
    const ruleChanges = diffRule(before, updated);
    if (ruleChanges.length === 0) continue;
    const warning = updated.enabled ? ruleSoftWarning(updated) : null;
    if (warning) softWarnings.push(warning);
    rules[index] = updated;
    ruleUpdates.push(updated);
    for (const change of ruleChanges) {
      changes.push({
        entityType: "rule",
        entityId: before.code,
        field: change.field,
        label: `${before.label} — ${change.field}`,
        before: change.before,
        after: change.after,
        oldValue: before,
        newValue: updated,
      });
    }
  }

  // ─── Véhicules ────────────────────────────────────────────────────────────
  const vehicles = current.vehicles.map((v) => ({ ...v }));
  const vehicleUpdates: VehicleCategory[] = [];
  const vehicleInserts: VehicleCategory[] = [];
  const vehicleCodes = new Set(vehicles.map((v) => v.code));
  const upsertSupplementRule = (kind: "vehicle" | "situation", item: { code: string; label: string }, supplement: SupplementDraft, entityLabel: string) => {
    const code = `${kind}.${item.code}`;
    let index = rules.findIndex((rule) => rule.code === code);
    let created = false;
    if (index < 0) {
      const base = supplementRuleFor(kind, item, Math.max(0, ...rules.filter((r) => r.category === kind).map((r) => r.priority)) + 1);
      rules.push(base);
      index = rules.length - 1;
      created = true;
    }
    const before = rules[index] as PricingRule;
    const next = applySupplement(before, supplement);
    const beforeText = describeSupplement(ruleToSupplement(created ? undefined : before));
    const afterText = describeSupplement(supplement);
    if (created) {
      ruleInserts.push(next);
    } else if (JSON.stringify(before) !== JSON.stringify(next)) {
      ruleUpdates.push(next);
    }
    rules[index] = next;
    if (beforeText !== afterText) {
      const warning = next.enabled ? ruleSoftWarning(next) : null;
      if (warning) softWarnings.push(warning);
      changes.push({
        entityType: "rule",
        entityId: code,
        field: "supplément",
        label: `${entityLabel} — Supplément`,
        before: beforeText,
        after: afterText,
        oldValue: before,
        newValue: next,
      });
    }
  };

  for (const item of draft.vehicles ?? []) {
    const label = String(item.label ?? "").trim();
    const errorKey = `vehicle:${item.code || item.tempId}`;
    if (label.length < 2 || label.length > 60) {
      errors[errorKey] = "Donnez un nom au véhicule (2 à 60 caractères).";
      continue;
    }
    if (!["accepted", "on_request", "refused"].includes(item.acceptance)) {
      errors[errorKey] = "Choix invalide.";
      continue;
    }
    const supplementError = validateSupplement(item.supplement);
    if (supplementError) {
      errors[errorKey] = `« ${label} » : ${supplementError}`;
      continue;
    }
    if (item.isNew || !item.code) {
      const code = uniqueCode(slugCode(label), vehicleCodes);
      const vehicle: VehicleCategory = {
        code,
        label,
        icon: "autre",
        sortOrder: Math.max(0, ...vehicles.map((v) => v.sortOrder)) + 10,
        clientVisible: Boolean(item.clientVisible),
        acceptance: item.acceptance,
        active: true,
      };
      vehicles.push(vehicle);
      vehicleInserts.push(vehicle);
      changes.push({
        entityType: "vehicle",
        entityId: code,
        field: "création",
        label: `Nouveau type de véhicule « ${label} »`,
        before: "—",
        after: VEHICLE_ACCEPTANCE_LABELS[vehicle.acceptance],
        oldValue: null,
        newValue: vehicle,
      });
      upsertSupplementRule("vehicle", vehicle, item.supplement, `Véhicule « ${label} »`);
      continue;
    }
    const index = vehicles.findIndex((v) => v.code === item.code);
    if (index < 0) {
      errors[errorKey] = "Véhicule introuvable : rechargez la page.";
      continue;
    }
    const before = vehicles[index] as VehicleCategory;
    const updated: VehicleCategory = {
      ...before,
      label,
      clientVisible: Boolean(item.clientVisible),
      acceptance: item.acceptance,
      active: Boolean(item.active),
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : before.sortOrder,
    };
    const fields: [string, string, string][] = [];
    if (before.label !== updated.label) fields.push(["Nom", before.label, updated.label]);
    if (before.acceptance !== updated.acceptance) fields.push(["Prix", VEHICLE_ACCEPTANCE_LABELS[before.acceptance], VEHICLE_ACCEPTANCE_LABELS[updated.acceptance]]);
    if (before.clientVisible !== updated.clientVisible) fields.push(["Proposé au client", before.clientVisible ? "Oui" : "Non", updated.clientVisible ? "Oui" : "Non"]);
    if (before.active !== updated.active) fields.push(["État", before.active ? "Actif" : "Supprimé", updated.active ? "Actif" : "Supprimé"]);
    if (before.sortOrder !== updated.sortOrder) fields.push(["Ordre", String(before.sortOrder), String(updated.sortOrder)]);
    if (fields.length > 0) {
      vehicles[index] = updated;
      vehicleUpdates.push(updated);
      for (const [field, b, a] of fields) {
        changes.push({ entityType: "vehicle", entityId: before.code, field, label: `Véhicule « ${before.label} » — ${field}`, before: b, after: a, oldValue: before, newValue: updated });
      }
    }
    upsertSupplementRule("vehicle", updated, item.supplement, `Véhicule « ${updated.label} »`);
  }

  // ─── Situations ───────────────────────────────────────────────────────────
  const situations = current.situations.map((s) => ({ ...s }));
  const situationUpdates: Situation[] = [];
  const situationInserts: Situation[] = [];
  const situationCodes = new Set(situations.map((s) => s.code));
  for (const item of draft.situations ?? []) {
    const label = String(item.label ?? "").trim();
    const clientLabel = String(item.clientLabel ?? "").trim() || label;
    const errorKey = `situation:${item.code || item.tempId}`;
    if (label.length < 2 || label.length > 60 || clientLabel.length > 60) {
      errors[errorKey] = "Donnez un nom à la situation (2 à 60 caractères).";
      continue;
    }
    if (!["problem", "state", "detail"].includes(item.group)) {
      errors[errorKey] = "Groupe invalide.";
      continue;
    }
    const supplementError = validateSupplement(item.supplement);
    if (supplementError) {
      errors[errorKey] = `« ${label} » : ${supplementError}`;
      continue;
    }
    if (item.isNew || !item.code) {
      const code = uniqueCode(slugCode(label), situationCodes);
      const situation: Situation = {
        code,
        label,
        clientLabel,
        icon: "other",
        group: item.group,
        sortOrder: Math.max(0, ...situations.map((s) => s.sortOrder)) + 10,
        clientVisible: Boolean(item.clientVisible),
        onSitePossible: Boolean(item.onSitePossible),
        active: true,
      };
      situations.push(situation);
      situationInserts.push(situation);
      changes.push({
        entityType: "situation",
        entityId: code,
        field: "création",
        label: `Nouvelle situation « ${label} »`,
        before: "—",
        after: `${SITUATION_GROUP_LABELS[situation.group]}${situation.clientVisible ? ", proposée au client" : ""}`,
        oldValue: null,
        newValue: situation,
      });
      upsertSupplementRule("situation", situation, item.supplement, `Situation « ${label} »`);
      continue;
    }
    const index = situations.findIndex((s) => s.code === item.code);
    if (index < 0) {
      errors[errorKey] = "Situation introuvable : rechargez la page.";
      continue;
    }
    const before = situations[index] as Situation;
    const updated: Situation = {
      ...before,
      label,
      clientLabel,
      clientVisible: Boolean(item.clientVisible),
      onSitePossible: Boolean(item.onSitePossible),
      active: Boolean(item.active),
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : before.sortOrder,
    };
    const fields: [string, string, string][] = [];
    if (before.label !== updated.label) fields.push(["Nom", before.label, updated.label]);
    if (before.clientLabel !== updated.clientLabel) fields.push(["Nom affiché au client", before.clientLabel, updated.clientLabel]);
    if (before.clientVisible !== updated.clientVisible) fields.push(["Proposée au client", before.clientVisible ? "Oui" : "Non", updated.clientVisible ? "Oui" : "Non"]);
    if (before.onSitePossible !== updated.onSitePossible) fields.push(["Réglable sur place", before.onSitePossible ? "Oui" : "Non", updated.onSitePossible ? "Oui" : "Non"]);
    if (before.active !== updated.active) fields.push(["État", before.active ? "Active" : "Supprimée", updated.active ? "Active" : "Supprimée"]);
    if (fields.length > 0) {
      situations[index] = updated;
      situationUpdates.push(updated);
      for (const [field, b, a] of fields) {
        changes.push({ entityType: "situation", entityId: before.code, field, label: `Situation « ${before.label} » — ${field}`, before: b, after: a, oldValue: before, newValue: updated });
      }
    }
    upsertSupplementRule("situation", updated, item.supplement, `Situation « ${updated.label} »`);
  }

  return {
    errors,
    softWarnings: [...new Set(softWarnings)],
    changes,
    next: { values, rules, vehicles, situations },
    settingWrites,
    ruleUpdates: dedupeById(ruleUpdates.filter((rule) => !ruleInserts.some((inserted) => inserted.id === rule.id))),
    ruleInserts,
    ruleArchives,
    vehicleUpdates,
    vehicleInserts,
    situationUpdates,
    situationInserts,
  };
}

function dedupeById(rules: PricingRule[]): PricingRule[] {
  const map = new Map<string, PricingRule>();
  for (const rule of rules) map.set(rule.id, rule);
  return [...map.values()];
}

function validateSupplement(supplement: SupplementDraft | undefined): string | null {
  if (!supplement || !["none", "fixed", "percent"].includes(supplement.mode)) return "supplément invalide.";
  if (!Number.isInteger(supplement.amountCents) || supplement.amountCents < 0 || supplement.amountCents > 500_000) return "montant invalide.";
  if (!Number.isInteger(supplement.rateBp) || supplement.rateBp < 0 || supplement.rateBp > 50_000) return "pourcentage invalide.";
  return null;
}

// ─── Contrôle de forme du brouillon reçu du navigateur ──────────────────────

const supplementSchema = z.object({
  mode: z.enum(["none", "fixed", "percent"]),
  amountCents: z.number().int(),
  rateBp: z.number().int(),
});

const RULE_CATEGORIES = ["fee", "leg", "fixed_fee", "vehicle", "situation", "custom", "time_slot", "day", "holiday", "discount", "internal_cost"] as const;

/** Forme générale du brouillon ; le contenu est ensuite vérifié en détail par applyDraft. */
export const pricingDraftSchema = z.object({
  settings: z.record(z.string().max(80), z.unknown()),
  rules: z
    .array(
      z.looseObject({
        id: z.string().max(80),
        code: z.string().max(100),
        label: z.string().max(200),
        category: z.enum(RULE_CATEGORIES),
        enabled: z.boolean(),
        calculation: z.unknown(),
        conditions: z.array(z.any()).max(10),
        priority: z.number().int(),
        clientVisible: z.boolean(),
        clientLabel: z.string().max(200).nullable().optional(),
        isNew: z.boolean().optional(),
        archived: z.boolean().optional(),
      }),
    )
    .max(400),
  vehicles: z
    .array(
      z.looseObject({
        code: z.string().max(60),
        label: z.string().max(200),
        acceptance: z.enum(["accepted", "on_request", "refused"]),
        clientVisible: z.boolean(),
        active: z.boolean(),
        sortOrder: z.number().int(),
        isNew: z.boolean().optional(),
        tempId: z.string().max(80).optional(),
        supplement: supplementSchema,
      }),
    )
    .max(100),
  situations: z
    .array(
      z.looseObject({
        code: z.string().max(60),
        label: z.string().max(200),
        clientLabel: z.string().max(200),
        group: z.enum(["problem", "state", "detail"]),
        clientVisible: z.boolean(),
        onSitePossible: z.boolean(),
        active: z.boolean(),
        sortOrder: z.number().int(),
        isNew: z.boolean().optional(),
        tempId: z.string().max(80).optional(),
        supplement: supplementSchema,
      }),
    )
    .max(100),
});
