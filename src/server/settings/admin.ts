/**
 * Enregistrement des paramètres (entreprise, site, mentions légales, zone, dépôt…).
 * Validation par le registre, journal « qui / quand / avant / après », et nouvelle version des
 * tarifs quand le réglage entre dans le calcul des prix (zone, dépôt, trajets).
 */
import { desc, eq } from "drizzle-orm";
import { displaySettingValue, schemaFor, softLimitWarning } from "@/core/settings/validation";
import { isSnapshotKey, keysOfSection, SECTIONS, SETTINGS, type SectionId, type SettingKey } from "@/core/settings/registry";
import type { Db } from "@/server/db/client";
import { auditLog, settings } from "@/server/db/schema";
import { loadSettingsValues, type DbLike } from "@/server/settings/repository";
import { ensureConfigVersion } from "@/server/settings/versions";

export type Actor = { userId: string | null; label: string };

export type SettingsSaveResult =
  | { ok: true; changeCount: number; versionNumber: number | null }
  | { ok: false; message: string; errors: Record<string, string> };

/** Sections modifiables depuis « Paramètres » (les tarifs ont leur propre écran). */
export function isSettingsSection(section: string): section is SectionId {
  return Object.prototype.hasOwnProperty.call(SECTIONS, section) && SECTIONS[section as SectionId].area === "settings";
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function saveSettingsSection(
  db: Db,
  section: SectionId,
  raw: Record<string, unknown>,
  actor: Actor,
): Promise<SettingsSaveResult> {
  if (!isSettingsSection(section)) return { ok: false, message: "Section inconnue.", errors: {} };
  const allowed = new Set<SettingKey>(keysOfSection(section));
  const errors: Record<string, string> = {};
  const parsed: Partial<Record<SettingKey, unknown>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key as SettingKey)) {
      errors[key] = "Réglage inconnu dans cette section.";
      continue;
    }
    const result = schemaFor(key as SettingKey).safeParse(value);
    if (result.success) parsed[key as SettingKey] = result.data;
    else errors[key] = result.error.issues[0]?.message ?? "Valeur invalide.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, message: "Certaines valeurs ne sont pas valides.", errors };

  return db.transaction(async (tx) => {
    const current = await loadSettingsValues(tx);
    const changed = (Object.keys(parsed) as SettingKey[]).filter((key) => !sameValue(current[key], parsed[key]));
    if (changed.length === 0) return { ok: true as const, changeCount: 0, versionNumber: null };
    const now = new Date();
    for (const key of changed) {
      await tx
        .insert(settings)
        .values({ key, value: parsed[key], updatedAt: now, updatedBy: actor.userId })
        .onConflictDoUpdate({ target: settings.key, set: { value: parsed[key], updatedAt: now, updatedBy: actor.userId } });
    }
    let versionId: string | null = null;
    let versionNumber: number | null = null;
    if (changed.some(isSnapshotKey)) {
      const first = changed[0] as SettingKey;
      const summary =
        changed.length === 1
          ? `${SETTINGS[first].label} : ${displaySettingValue(first, current[first])} → ${displaySettingValue(first, parsed[first])}`
          : `${SECTIONS[section].label} : ${changed.length} modifications`;
      const { version } = await ensureConfigVersion(tx, { summary, userId: actor.userId });
      versionId = version.id;
      versionNumber = version.versionNumber;
    }
    await tx.insert(auditLog).values(
      changed.map((key) => ({
        userId: actor.userId,
        userLabel: actor.label,
        entityType: "setting",
        entityId: key,
        field: key,
        label: `${SECTIONS[section].label} — ${SETTINGS[key].label}`,
        oldValue: current[key] ?? null,
        newValue: parsed[key] ?? null,
        displayOld: displaySettingValue(key, current[key]),
        displayNew: displaySettingValue(key, parsed[key]),
        reason: null,
        configVersionId: isSnapshotKey(key) ? versionId : null,
      })),
    );
    return { ok: true as const, changeCount: changed.length, versionNumber };
  });
}

/** Avertissements « valeur inhabituelle » pour une liste de valeurs (affichés avant d'enregistrer). */
export function settingsWarnings(values: Record<string, unknown>): string[] {
  return Object.entries(values)
    .map(([key, value]) => (Object.prototype.hasOwnProperty.call(SETTINGS, key) ? softLimitWarning(key as SettingKey, value) : null))
    .filter((w): w is string => w !== null);
}

/** Dernières modifications de paramètres (toutes sections « Paramètres »). */
export async function recentSettingChanges(db: DbLike, limit = 12) {
  const rows = await db.select().from(auditLog).where(eq(auditLog.entityType, "setting")).orderBy(desc(auditLog.at)).limit(200);
  return rows
    .filter((row) => Object.prototype.hasOwnProperty.call(SETTINGS, row.entityId) && SECTIONS[SETTINGS[row.entityId as SettingKey].section].area === "settings")
    .slice(0, limit);
}
