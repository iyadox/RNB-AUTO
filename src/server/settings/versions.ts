/** Versions des tarifs : chaque enregistrement crée une photographie numérotée et non modifiable. */
import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { buildSnapshot, stableStringify, type ConfigSnapshot } from "@/core/settings/snapshot";
import { pricingConfigVersions } from "@/server/db/schema";
import { loadRules, loadSettingsValues, loadSituations, loadVehicles, type DbLike } from "./repository";

export type ConfigVersion = typeof pricingConfigVersions.$inferSelect;

export function snapshotHash(snapshot: ConfigSnapshot): string {
  return createHash("sha256").update(stableStringify(snapshot)).digest("hex");
}

/** Photographie construite à partir des tables actuelles (réglages, règles, véhicules, situations). */
export async function snapshotFromTables(db: DbLike): Promise<ConfigSnapshot> {
  const [values, rules, vehicles, situationList] = await Promise.all([
    loadSettingsValues(db),
    loadRules(db),
    loadVehicles(db),
    loadSituations(db),
  ]);
  return buildSnapshot(values, rules, vehicles, situationList);
}

export async function getLatestVersion(db: DbLike): Promise<ConfigVersion | null> {
  const [row] = await db.select().from(pricingConfigVersions).orderBy(desc(pricingConfigVersions.versionNumber)).limit(1);
  return row ?? null;
}

export async function getVersionById(db: DbLike, id: string): Promise<ConfigVersion | null> {
  const [row] = await db.select().from(pricingConfigVersions).where(eq(pricingConfigVersions.id, id)).limit(1);
  return row ?? null;
}

export async function listVersions(db: DbLike, limit = 50): Promise<ConfigVersion[]> {
  return db.select().from(pricingConfigVersions).orderBy(desc(pricingConfigVersions.versionNumber)).limit(limit);
}

/**
 * Crée une nouvelle version si les tarifs ont changé depuis la dernière.
 * Renvoie la version en vigueur (nouvelle ou inchangée).
 */
export async function ensureConfigVersion(
  db: DbLike,
  options: { summary: string; reason?: string | null; userId?: string | null },
): Promise<{ version: ConfigVersion; created: boolean }> {
  const snapshot = await snapshotFromTables(db);
  const hash = snapshotHash(snapshot);
  const latest = await getLatestVersion(db);
  if (latest && latest.hash === hash) return { version: latest, created: false };
  const [version] = await db
    .insert(pricingConfigVersions)
    .values({
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      snapshot,
      hash,
      changeSummary: options.summary,
      reason: options.reason ?? null,
      createdBy: options.userId ?? null,
    })
    .returning();
  if (!version) throw new Error("Impossible d'enregistrer la version des tarifs.");
  return { version, created: true };
}
