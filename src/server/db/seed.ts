/**
 * Remplit une base vide avec les données de départ. Sans risque à relancer :
 * rien d'existant n'est modifié, seuls les éléments manquants sont ajoutés.
 */
import { sql } from "drizzle-orm";
import { SETTING_KEYS, SETTINGS, type SettingKey } from "@/core/settings/registry";
import { schemaFor } from "@/core/settings/validation";
import { ensureConfigVersion, getLatestVersion } from "@/server/settings/versions";
import type { Db } from "./client";
import { pricingRules, referenceTrips, settings, situations, vehicleCategories } from "./schema";
import { SEED_REFERENCE_TRIPS, SEED_RULES, SEED_SITUATIONS, SEED_VEHICLES } from "./seed-data";

/** Variables d'environnement facultatives, lues uniquement à la première installation. */
const ENV_OVERRIDES: Partial<Record<SettingKey, string>> = {
  "company.phone": "SEED_COMPANY_PHONE",
  "company.whatsapp": "SEED_COMPANY_WHATSAPP",
  "company.email": "SEED_COMPANY_EMAIL",
  "company.availability": "SEED_COMPANY_AVAILABILITY",
};

function initialValue(key: SettingKey): unknown {
  const envName = ENV_OVERRIDES[key];
  const fromEnv = envName ? process.env[envName]?.trim() : undefined;
  if (fromEnv) {
    const parsed = schemaFor(key).safeParse(fromEnv);
    if (parsed.success) return parsed.data;
    console.warn(`[installation] ${envName} ignorée : valeur invalide.`);
  }
  return structuredClone(SETTINGS[key].initialValue);
}

export async function ensureSeedData(db: Db): Promise<{ inserted: number; versionCreated: boolean }> {
  return db.transaction(async (tx) => {
    let inserted = 0;

    const settingRows = await tx
      .insert(settings)
      .values(SETTING_KEYS.map((key) => ({ key, value: initialValue(key) })))
      .onConflictDoNothing()
      .returning({ key: settings.key });
    inserted += settingRows.length;

    const vehicleRows = await tx
      .insert(vehicleCategories)
      .values(SEED_VEHICLES.map((v) => ({ ...v })))
      .onConflictDoNothing()
      .returning({ code: vehicleCategories.code });
    inserted += vehicleRows.length;

    const situationRows = await tx
      .insert(situations)
      .values(
        SEED_SITUATIONS.map((s) => ({
          code: s.code,
          label: s.label,
          clientLabel: s.clientLabel,
          icon: s.icon,
          groupName: s.group,
          sortOrder: s.sortOrder,
          clientVisible: s.clientVisible,
          onSitePossible: s.onSitePossible,
          active: s.active,
        })),
      )
      .onConflictDoNothing()
      .returning({ code: situations.code });
    inserted += situationRows.length;

    const ruleRows = await tx
      .insert(pricingRules)
      .values(SEED_RULES.map((r) => ({ ...r, help: r.help ?? null, clientLabel: r.clientLabel ?? null })))
      .onConflictDoNothing({ target: pricingRules.code })
      .returning({ code: pricingRules.code });
    inserted += ruleRows.length;

    const [tripCount] = await tx.select({ n: sql<number>`count(*)::int` }).from(referenceTrips);
    if ((tripCount?.n ?? 0) === 0) {
      await tx.insert(referenceTrips).values(
        SEED_REFERENCE_TRIPS.map((trip, index) => ({ name: trip.name, scenario: trip.scenario, sortOrder: (index + 1) * 10 })),
      );
    }

    const latest = await getLatestVersion(tx);
    let versionCreated = false;
    if (!latest || inserted > 0) {
      const result = await ensureConfigVersion(tx, {
        summary: latest
          ? "Mise à jour du système : nouveaux réglages ajoutés avec leurs valeurs de départ."
          : "Installation : valeurs de départ (moyennes du marché en Île-de-France, octobre 2026).",
      });
      versionCreated = result.created;
    }
    return { inserted, versionCreated };
  });
}
