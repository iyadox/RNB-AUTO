/**
 * Exemples de prix de l'accueil : calculés par le moteur avec la dernière version des tarifs,
 * sur une base PostgreSQL embarquée en mémoire (PGlite : migrations + données de départ).
 * Aucune valeur attendue n'est écrite en dur : tout est recalculé à partir des réglages.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { computeQuote } from "@/core/pricing";
import { clientIncludedLabels } from "@/core/quotes/client-view";
import { scenarioToEngineInput } from "@/core/quotes/types";
import type { ConfigSnapshot } from "@/core/settings/snapshot";
import type { Db } from "@/server/db/client";
import { HOME_EXAMPLE_SCENARIO } from "@/server/db/seed-data";

process.env.DATABASE_URL = "pglite:memory://";
process.env.GEO_PROVIDER = "simulation";

const actor = { userId: null, label: "Test" };
let db: Db;
let snapshot: ConfigSnapshot;

beforeAll(async () => {
  const { getDb } = await import("@/server/db/client");
  const { getLatestVersion } = await import("@/server/settings/versions");
  db = await getDb();
  const version = await getLatestVersion(db);
  if (!version) throw new Error("aucune version des tarifs");
  snapshot = version.snapshot;
}, 120_000);

const priceAt = (isoWeekday: typeof HOME_EXAMPLE_SCENARIO.isoWeekday, time: string) =>
  computeQuote(
    scenarioToEngineInput({ ...HOME_EXAMPLE_SCENARIO, isoWeekday, time }, snapshot.fuel.manualPriceMillis, "online"),
    snapshot.pricing,
  );

describe("exemples de prix de l'accueil", () => {
  it("journée : le trajet type calculé par le moteur, identique à l'exemple des informations du site", async () => {
    const { getHomePriceExamples } = await import("./price-examples");
    const { getPublicSiteInfo } = await import("./public-info");
    const examples = await getHomePriceExamples();
    expect(examples).not.toBeNull();
    const expected = priceAt(HOME_EXAMPLE_SCENARIO.isoWeekday, HOME_EXAMPLE_SCENARIO.time);
    expect(examples?.weekday.priceTtcCents).toBe(expected.client.priceTtcCents);
    expect(examples?.weekday.includedLabels).toEqual(clientIncludedLabels(expected, snapshot.estimate.showSupplementLabels));
    expect(examples?.weekday.when).toBe("un mardi après-midi");
    expect(examples?.weekday.approachKm).toBe(HOME_EXAMPLE_SCENARIO.legs.emptyOut.km);
    expect(examples?.weekday.loadedKm).toBe(HOME_EXAMPLE_SCENARIO.legs.loaded?.km);
    const info = await getPublicSiteInfo();
    expect(info.examplePrice?.priceTtcCents).toBe(examples?.weekday.priceTtcCents);
  });

  it("nuit : à l'heure de début de la première plage horaire active ; dimanche : à l'heure du trajet type", async () => {
    const { getHomePriceExamples, firstNightStart, hourLabel } = await import("./price-examples");
    const examples = await getHomePriceExamples();
    const start = firstNightStart(snapshot.pricing);
    expect(start).not.toBeNull();
    const night = priceAt(HOME_EXAMPLE_SCENARIO.isoWeekday, start as string);
    expect(examples?.night?.priceTtcCents).toBe(night.client.priceTtcCents);
    expect(examples?.night?.when).toBe(`un mardi à ${hourLabel(start as string)}`);
    expect(examples?.night?.includedLabels).toEqual(clientIncludedLabels(night, snapshot.estimate.showSupplementLabels));

    const sunday = priceAt(7, HOME_EXAMPLE_SCENARIO.time);
    expect(examples?.sunday?.priceTtcCents).toBe(sunday.client.priceTtcCents);
    expect(examples?.sunday?.when).toBe("un dimanche après-midi");
    // Avec les données de départ, nuit et dimanche sont majorés : le moment change le prix.
    expect(examples?.night?.priceTtcCents).toBeGreaterThan(examples?.weekday.priceTtcCents ?? Infinity);
    expect(examples?.sunday?.priceTtcCents).toBeGreaterThan(examples?.weekday.priceTtcCents ?? Infinity);
  });

  it("sans plage horaire active, pas d'exemple de nuit ; sans prix de journée, aucun exemple", async () => {
    const { buildHomePriceExamples } = await import("./price-examples");
    const withoutNight: ConfigSnapshot = {
      ...snapshot,
      pricing: {
        ...snapshot.pricing,
        rules: snapshot.pricing.rules.map((rule) => (rule.category === "time_slot" ? { ...rule, enabled: false } : rule)),
      },
    };
    const examples = buildHomePriceExamples(withoutNight);
    expect(examples?.night).toBeNull();
    expect(examples?.sunday).not.toBeNull();

    const refused: ConfigSnapshot = {
      ...snapshot,
      pricing: {
        ...snapshot.pricing,
        vehicles: snapshot.pricing.vehicles.map((v) =>
          v.code === HOME_EXAMPLE_SCENARIO.vehicleCategory ? { ...v, acceptance: "refused" as const } : v,
        ),
      },
    };
    expect(buildHomePriceExamples(refused)).toBeNull();
  });

  it("libellés des suppléments masqués si le réglage est désactivé", async () => {
    const { buildHomePriceExamples } = await import("./price-examples");
    const hidden = buildHomePriceExamples({ ...snapshot, estimate: { ...snapshot.estimate, showSupplementLabels: false } });
    const shown = buildHomePriceExamples({ ...snapshot, estimate: { ...snapshot.estimate, showSupplementLabels: true } });
    expect(hidden?.night?.priceTtcCents).toBe(shown?.night?.priceTtcCents);
    expect((hidden?.night?.includedLabels.length ?? 0)).toBeLessThan(shown?.night?.includedLabels.length ?? 0);
  });

  it("exemple désactivé dans les réglages : null", async () => {
    const { getHomePriceExamples } = await import("./price-examples");
    const { saveSettingsSection } = await import("@/server/settings/admin");
    expect((await saveSettingsSection(db, "site", { "site.showExamplePrice": false }, actor)).ok).toBe(true);
    expect(await getHomePriceExamples()).toBeNull();
    await saveSettingsSection(db, "site", { "site.showExamplePrice": true }, actor);
    expect(await getHomePriceExamples()).not.toBeNull();
  });
});
