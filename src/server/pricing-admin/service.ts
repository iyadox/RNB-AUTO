/**
 * « Mes tarifs » côté serveur : aperçu d'impact, enregistrement (transaction + journal + version),
 * retour à une version précédente, historique.
 */
import { desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { computeQuote, type PricingConfig, type PricingRule } from "@/core/pricing";
import { scenarioToEngineInput, type ReferenceScenario } from "@/core/quotes/types";
import { isSnapshotKey, SETTINGS, type SettingKey } from "@/core/settings/registry";
import { applyDraft, toDraft, type AppliedDraft, type ChangeEntry, type CurrentPricingState, type PricingDraft } from "@/core/settings/editor";
import { buildPricingConfig } from "@/core/settings/snapshot";
import { displaySettingValue, schemaFor } from "@/core/settings/validation";
import type { Db } from "@/server/db/client";
import { auditLog, pricingConfigVersions, pricingRules, referenceTrips, settings, situations, vehicleCategories } from "@/server/db/schema";
import { currentFuelPrice } from "@/server/fuel/service";
import { loadRules, loadSettingsValues, loadSituations, loadVehicles, type DbLike } from "@/server/settings/repository";
import { ensureConfigVersion, getLatestVersion, getVersionById } from "@/server/settings/versions";

export type Actor = { userId: string; label: string };

export async function loadCurrentPricingState(db: DbLike): Promise<CurrentPricingState> {
  const [values, rules, vehicles, situationList] = await Promise.all([
    loadSettingsValues(db),
    loadRules(db),
    loadVehicles(db),
    loadSituations(db),
  ]);
  return { values, rules, vehicles, situations: situationList };
}

export async function loadPricingEditor(db: DbLike) {
  const state = await loadCurrentPricingState(db);
  const version = await getLatestVersion(db);
  return { draft: toDraft(state), versionNumber: version?.versionNumber ?? 0 };
}

export type ImpactRow = { name: string; before: number | null; after: number | null };

async function referenceImpact(db: DbLike, before: PricingConfig, after: PricingConfig, fuelPriceMillis: number): Promise<ImpactRow[]> {
  const trips = await db.select().from(referenceTrips).where(eq(referenceTrips.active, true)).orderBy(referenceTrips.sortOrder);
  return trips.map((trip) => {
    const scenario = trip.scenario as ReferenceScenario;
    const run = (config: PricingConfig) => {
      try {
        return computeQuote(scenarioToEngineInput(scenario, fuelPriceMillis, "online"), config).client.priceTtcCents;
      } catch {
        return null;
      }
    };
    return { name: trip.name, before: run(before), after: run(after) };
  });
}

export type PreviewResult = {
  errors: Record<string, string>;
  softWarnings: string[];
  changes: Pick<ChangeEntry, "label" | "before" | "after">[];
  impact: ImpactRow[];
};

export async function previewDraft(db: DbLike, draft: PricingDraft): Promise<PreviewResult> {
  const current = await loadCurrentPricingState(db);
  const applied = applyDraft(current, draft);
  const latest = await getLatestVersion(db);
  let impact: ImpactRow[] = [];
  if (latest && Object.keys(applied.errors).length === 0 && applied.changes.length > 0) {
    const fuel = await currentFuelPrice(db, latest.snapshot.fuel);
    const nextConfig = buildPricingConfig(applied.next.values, applied.next.rules, applied.next.vehicles, applied.next.situations);
    const currentConfig = buildPricingConfig(current.values, current.rules, current.vehicles, current.situations);
    impact = await referenceImpact(db, currentConfig, nextConfig, fuel.priceTtcMillis);
  }
  return {
    errors: applied.errors,
    softWarnings: applied.softWarnings,
    changes: applied.changes.map(({ label, before, after }) => ({ label, before, after })),
    impact,
  };
}

function ruleRow(rule: PricingRule) {
  return {
    code: rule.code,
    label: rule.label,
    help: rule.help ?? null,
    category: rule.category,
    ledger: rule.ledger,
    enabled: rule.enabled,
    effect: rule.effect,
    calculation: rule.calculation,
    conditions: rule.conditions,
    priority: rule.priority,
    clientVisible: rule.clientVisible,
    clientLabel: rule.clientLabel ?? null,
    system: rule.system,
  };
}

async function persistApplied(db: DbLike, applied: AppliedDraft, actor: Actor) {
  const now = new Date();
  for (const write of applied.settingWrites) {
    await db
      .insert(settings)
      .values({ key: write.key, value: write.value, updatedAt: now, updatedBy: actor.userId })
      .onConflictDoUpdate({ target: settings.key, set: { value: write.value, updatedAt: now, updatedBy: actor.userId } });
  }
  for (const rule of applied.ruleUpdates) {
    await db.update(pricingRules).set({ ...ruleRow(rule), updatedAt: now, updatedBy: actor.userId }).where(eq(pricingRules.id, rule.id));
  }
  for (const rule of applied.ruleInserts) {
    await db
      .insert(pricingRules)
      .values({ ...ruleRow(rule), updatedBy: actor.userId })
      .onConflictDoUpdate({ target: pricingRules.code, set: { ...ruleRow(rule), archived: false, updatedAt: now, updatedBy: actor.userId } });
  }
  for (const rule of applied.ruleArchives) {
    await db.update(pricingRules).set({ archived: true, enabled: false, updatedAt: now, updatedBy: actor.userId }).where(eq(pricingRules.id, rule.id));
  }
  for (const vehicle of [...applied.vehicleUpdates, ...applied.vehicleInserts]) {
    await db
      .insert(vehicleCategories)
      .values({ ...vehicle, updatedAt: now })
      .onConflictDoUpdate({ target: vehicleCategories.code, set: { ...vehicle, updatedAt: now } });
  }
  for (const situation of [...applied.situationUpdates, ...applied.situationInserts]) {
    const row = {
      code: situation.code,
      label: situation.label,
      clientLabel: situation.clientLabel,
      icon: situation.icon,
      groupName: situation.group,
      sortOrder: situation.sortOrder,
      clientVisible: situation.clientVisible,
      onSitePossible: situation.onSitePossible,
      active: situation.active,
      updatedAt: now,
    };
    await db.insert(situations).values(row).onConflictDoUpdate({ target: situations.code, set: row });
  }
}

async function writeAudit(db: DbLike, changes: ChangeEntry[], actor: Actor, reason: string | null, versionId: string | null) {
  if (changes.length === 0) return;
  await db.insert(auditLog).values(
    changes.map((change) => ({
      userId: actor.userId,
      userLabel: actor.label,
      entityType: change.entityType,
      entityId: change.entityId,
      field: change.field,
      label: change.label,
      oldValue: change.oldValue === undefined ? null : change.oldValue,
      newValue: change.newValue === undefined ? null : change.newValue,
      displayOld: change.before,
      displayNew: change.after,
      reason,
      configVersionId: versionId,
    })),
  );
}

export class PricingConflictError extends Error {}

export type SaveResult =
  | { ok: true; versionNumber: number; previousVersionId: string | null; changeCount: number }
  | { ok: false; errors: Record<string, string>; message: string };

export async function saveDraft(
  db: Db,
  draft: PricingDraft,
  options: { actor: Actor; reason: string | null; baseVersionNumber: number },
): Promise<SaveResult> {
  return db.transaction(async (tx) => {
    const latest = await getLatestVersion(tx);
    if ((latest?.versionNumber ?? 0) !== options.baseVersionNumber) {
      return {
        ok: false as const,
        errors: {},
        message: "Les tarifs ont été modifiés entre-temps (sur un autre appareil ?). Rechargez la page avant d'enregistrer.",
      };
    }
    const current = await loadCurrentPricingState(tx);
    const applied = applyDraft(current, draft);
    if (Object.keys(applied.errors).length > 0) {
      return { ok: false as const, errors: applied.errors, message: "Certaines valeurs ne sont pas valides." };
    }
    if (applied.changes.length === 0) {
      return { ok: true as const, versionNumber: latest?.versionNumber ?? 0, previousVersionId: latest?.id ?? null, changeCount: 0 };
    }
    await persistApplied(tx, applied, options.actor);
    const summary =
      applied.changes.length === 1
        ? `${applied.changes[0]?.label} : ${applied.changes[0]?.before} → ${applied.changes[0]?.after}`
        : `${applied.changes.length} modifications des tarifs`;
    const { version } = await ensureConfigVersion(tx, { summary, reason: options.reason, userId: options.actor.userId });
    await writeAudit(tx, applied.changes, options.actor, options.reason, version.id);
    return { ok: true as const, versionNumber: version.versionNumber, previousVersionId: latest?.id ?? null, changeCount: applied.changes.length };
  });
}

/** Revenir à une version : crée une NOUVELLE version identique à l'ancienne (l'historique n'est jamais réécrit). */
export async function revertToVersion(
  db: Db,
  versionId: string,
  actor: Actor,
): Promise<{ ok: true; versionNumber: number } | { ok: false; message: string }> {
  return db.transaction(async (tx) => {
    const target = await getVersionById(tx, versionId);
    if (!target) return { ok: false as const, message: "Version introuvable." };
    const snapshot = target.snapshot;
    const now = new Date();
    const changes: ChangeEntry[] = [];

    // Réglages
    const currentValues = await loadSettingsValues(tx);
    for (const [key, value] of Object.entries(snapshot.settings ?? {})) {
      if (!Object.prototype.hasOwnProperty.call(SETTINGS, key) || !isSnapshotKey(key as SettingKey)) continue;
      const parsed = schemaFor(key as SettingKey).safeParse(value);
      if (!parsed.success) continue;
      const before = currentValues[key as SettingKey];
      if (JSON.stringify(before) === JSON.stringify(parsed.data)) continue;
      await tx
        .insert(settings)
        .values({ key, value: parsed.data, updatedAt: now, updatedBy: actor.userId })
        .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data, updatedAt: now, updatedBy: actor.userId } });
      changes.push({
        entityType: "setting",
        entityId: key,
        field: key,
        label: SETTINGS[key as SettingKey].label,
        before: displaySettingValue(key as SettingKey, before),
        after: displaySettingValue(key as SettingKey, parsed.data),
        oldValue: before,
        newValue: parsed.data,
      });
    }

    // Règles : celles de la version reprennent leurs valeurs ; les règles ajoutées depuis sont retirées.
    const snapshotCodes = new Set(snapshot.pricing.rules.map((rule) => rule.code));
    for (const rule of snapshot.pricing.rules) {
      await tx
        .insert(pricingRules)
        .values({ ...ruleRow(rule), updatedBy: actor.userId })
        .onConflictDoUpdate({ target: pricingRules.code, set: { ...ruleRow(rule), archived: false, updatedAt: now, updatedBy: actor.userId } });
    }
    const allRules = await tx.select().from(pricingRules);
    const toArchive = allRules.filter((rule) => !snapshotCodes.has(rule.code) && !rule.archived);
    if (toArchive.length > 0) {
      await tx
        .update(pricingRules)
        .set({ archived: true, enabled: false, updatedAt: now })
        .where(inArray(pricingRules.id, toArchive.map((rule) => rule.id)));
    }

    // Véhicules et situations
    const vehicleCodes = new Set(snapshot.pricing.vehicles.map((v) => v.code));
    for (const vehicle of snapshot.pricing.vehicles) {
      await tx.insert(vehicleCategories).values({ ...vehicle, updatedAt: now }).onConflictDoUpdate({ target: vehicleCategories.code, set: { ...vehicle, updatedAt: now } });
    }
    const allVehicles = await tx.select().from(vehicleCategories);
    for (const vehicle of allVehicles.filter((v) => !vehicleCodes.has(v.code) && v.active)) {
      await tx.update(vehicleCategories).set({ active: false, updatedAt: now }).where(eq(vehicleCategories.code, vehicle.code));
    }
    const situationCodes = new Set(snapshot.pricing.situations.map((s) => s.code));
    for (const situation of snapshot.pricing.situations) {
      const row = {
        code: situation.code,
        label: situation.label,
        clientLabel: situation.clientLabel,
        icon: situation.icon,
        groupName: situation.group,
        sortOrder: situation.sortOrder,
        clientVisible: situation.clientVisible,
        onSitePossible: situation.onSitePossible,
        active: situation.active,
        updatedAt: now,
      };
      await tx.insert(situations).values(row).onConflictDoUpdate({ target: situations.code, set: row });
    }
    const allSituations = await tx.select().from(situations);
    for (const situation of allSituations.filter((s) => !situationCodes.has(s.code) && s.active)) {
      await tx.update(situations).set({ active: false, updatedAt: now }).where(eq(situations.code, situation.code));
    }

    const { version } = await ensureConfigVersion(tx, {
      summary: `Retour aux tarifs de la version ${target.versionNumber}`,
      reason: null,
      userId: actor.userId,
    });
    await writeAudit(
      tx,
      [
        {
          entityType: "rule",
          entityId: `version-${target.versionNumber}`,
          field: "retour",
          label: `Retour aux tarifs de la version ${target.versionNumber}`,
          before: "",
          after: "",
          oldValue: null,
          newValue: { versionId: target.id },
        },
        ...changes.map((change) => ({ ...change, before: change.before.slice(0, 200), after: change.after.slice(0, 200) })),
      ],
      actor,
      null,
      version.id,
    );
    return { ok: true as const, versionNumber: version.versionNumber };
  });
}

export async function listPricingHistory(db: DbLike, limit = 60) {
  const versions = await db.select().from(pricingConfigVersions).orderBy(desc(pricingConfigVersions.versionNumber)).limit(limit);
  const ids = versions.map((v) => v.id);
  const entries = ids.length
    ? await db
        .select({
          id: auditLog.id,
          at: auditLog.at,
          userLabel: auditLog.userLabel,
          label: auditLog.label,
          displayOld: auditLog.displayOld,
          displayNew: auditLog.displayNew,
          reason: auditLog.reason,
          configVersionId: auditLog.configVersionId,
          field: auditLog.field,
        })
        .from(auditLog)
        .where(isNotNull(auditLog.configVersionId))
        .orderBy(desc(auditLog.at))
        .limit(1000)
    : [];
  return versions.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    createdAt: version.createdAt,
    summary: version.changeSummary,
    reason: version.reason,
    entries: entries.filter((entry) => entry.configVersionId === version.id),
  }));
}

export async function auditCount(db: DbLike): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(auditLog);
  return row?.n ?? 0;
}
