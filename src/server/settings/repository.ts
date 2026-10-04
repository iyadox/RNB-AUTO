/** Lecture des réglages, règles, véhicules et situations enregistrés en base. */
import { asc, eq } from "drizzle-orm";
import type { PricingRule, Situation, VehicleCategory } from "@/core/pricing/types";
import { SETTING_KEYS, SETTINGS, type SettingKey, type SettingsValues } from "@/core/settings/registry";
import { schemaFor } from "@/core/settings/validation";
import type { Db } from "@/server/db/client";
import { pricingRules, settings, situations, vehicleCategories } from "@/server/db/schema";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbLike = Db | Tx;

export function ruleFromRow(row: typeof pricingRules.$inferSelect): PricingRule {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    help: row.help,
    category: row.category as PricingRule["category"],
    ledger: row.ledger as PricingRule["ledger"],
    enabled: row.enabled,
    effect: row.effect as PricingRule["effect"],
    calculation: row.calculation,
    conditions: row.conditions,
    priority: row.priority,
    clientVisible: row.clientVisible,
    clientLabel: row.clientLabel,
    system: row.system,
  };
}

export function vehicleFromRow(row: typeof vehicleCategories.$inferSelect): VehicleCategory {
  return {
    code: row.code,
    label: row.label,
    icon: row.icon,
    sortOrder: row.sortOrder,
    clientVisible: row.clientVisible,
    acceptance: row.acceptance as VehicleCategory["acceptance"],
    active: row.active,
  };
}

export function situationFromRow(row: typeof situations.$inferSelect): Situation {
  return {
    code: row.code,
    label: row.label,
    clientLabel: row.clientLabel,
    icon: row.icon,
    group: row.groupName as Situation["group"],
    sortOrder: row.sortOrder,
    clientVisible: row.clientVisible,
    onSitePossible: row.onSitePossible,
    active: row.active,
  };
}

/** Toutes les valeurs des réglages. Une valeur absente ou invalide reprend sa valeur de départ. */
export async function loadSettingsValues(db: DbLike): Promise<SettingsValues> {
  const rows = await db.select().from(settings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const values: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) {
    const stored = byKey.get(key);
    const parsed = stored === undefined ? null : schemaFor(key).safeParse(stored);
    if (parsed?.success) {
      values[key] = parsed.data;
    } else {
      if (stored !== undefined) console.warn(`[réglages] valeur invalide pour « ${key} », valeur de départ utilisée.`);
      values[key] = structuredClone(SETTINGS[key].initialValue);
    }
  }
  return values as SettingsValues;
}

export async function loadSettingValue<K extends SettingKey>(db: DbLike, key: K): Promise<SettingsValues[K]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  const parsed = row ? schemaFor(key).safeParse(row.value) : null;
  return (parsed?.success ? parsed.data : structuredClone(SETTINGS[key].initialValue)) as SettingsValues[K];
}

export async function loadRules(db: DbLike, options: { includeArchived?: boolean } = {}): Promise<PricingRule[]> {
  const rows = await db.select().from(pricingRules).orderBy(asc(pricingRules.priority), asc(pricingRules.code));
  return rows.filter((r) => options.includeArchived || !r.archived).map(ruleFromRow);
}

export async function loadVehicles(db: DbLike): Promise<VehicleCategory[]> {
  const rows = await db.select().from(vehicleCategories).orderBy(asc(vehicleCategories.sortOrder));
  return rows.map(vehicleFromRow);
}

export async function loadSituations(db: DbLike): Promise<Situation[]> {
  const rows = await db.select().from(situations).orderBy(asc(situations.sortOrder));
  return rows.map(situationFromRow);
}
