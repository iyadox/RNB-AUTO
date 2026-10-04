/**
 * Tests d'intégration des parcours serveur, sur une base PostgreSQL embarquée en mémoire
 * (PGlite : migrations + données de départ) et des trajets simulés (aucun accès réseau).
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { QuoteRequestInput } from "@/core/quotes/types";
import type { Db } from "@/server/db/client";

process.env.DATABASE_URL = "pglite:memory://";
process.env.GEO_PROVIDER = "simulation";

const actor = { userId: null, label: "Test" };
let db: Db;

const request = (overrides: Partial<QuoteRequestInput> = {}): QuoteRequestInput => ({
  pickup: { label: "Drancy", lat: 48.9297, lng: 2.4458, postcode: "93700", city: "Drancy", source: "search", afterRegulatedRoad: false, handoverNote: null },
  dropoff: { kind: "address", place: { label: "Pantin", lat: 48.8944, lng: 2.4094, postcode: "93500", city: "Pantin", source: "search" } },
  vehicleCategory: "berline",
  situations: ["breakdown"],
  when: { kind: "simulated", isoWeekday: 2, time: "14:00", holiday: false },
  ...overrides,
});

beforeAll(async () => {
  const { getDb } = await import("@/server/db/client");
  db = await getDb();
}, 120_000);

async function newIntervention(source: "web" | "phone" = "phone") {
  const { createEstimate, getQuote } = await import("@/server/quotes/service");
  const { createInterventionFromQuote } = await import("@/server/interventions/service");
  const outcome = await createEstimate(request(), { channel: source === "web" ? "online" : "admin", source });
  const quote = await getQuote(db, outcome.quoteId as string);
  if (!quote) throw new Error("estimation absente");
  const intervention = await db.transaction((tx) =>
    createInterventionFromQuote(tx, quote, {
      source,
      contact: { name: "Client Test", phone: "06 12 34 56 78", email: null },
      vehicle: { brand: null, model: null, plate: null },
      comment: null,
      actor,
    }),
  );
  return { outcome, intervention };
}

describe("parcours d'une demande", () => {
  it("estimation enregistrée, demande créée avec son prix actuel", async () => {
    const { outcome, intervention } = await newIntervention();
    expect(outcome.result?.totals.priceTtcCents).toBeGreaterThan(0);
    expect(outcome.context?.legs?.emptyOut.km).toBeGreaterThan(0);
    expect(intervention.reference).toMatch(/^RNB-\d{4}-\d{5}$/);
    expect(intervention.status).toBe("new");
    expect(intervention.currentPriceCents).toBe(outcome.result?.totals.priceTtcCents);
  });

  it("accepter fige le prix ; un ajustement le remet à confirmer ; les retours en arrière sont refusés", async () => {
    const { changeStatus, addAdjustment, getIntervention, confirmPrice } = await import("@/server/interventions/service");
    const { outcome, intervention } = await newIntervention();
    const price = outcome.result?.totals.priceTtcCents as number;

    const accepted = await changeStatus(db, intervention.id, "accepted", actor);
    expect(accepted.confirmedPriceCents).toBe(price);
    await expect(changeStatus(db, intervention.id, "new", actor, { force: true })).rejects.toThrow();
    await expect(changeStatus(db, intervention.id, "completed", actor)).rejects.toThrow("pas possible");

    await addAdjustment(db, intervention.id, { effect: "supplement", mode: "amount", value: 1000, reason: "Attente sur place" }, actor);
    const adjusted = await getIntervention(db, intervention.id);
    expect(adjusted?.confirmedPriceCents).toBeNull();
    expect(adjusted?.currentPriceCents).toBeGreaterThan(price);

    const confirmed = await confirmPrice(db, intervention.id, actor);
    expect(confirmed).toBe(adjusted?.currentPriceCents);

    await expect(changeStatus(db, intervention.id, "cancelled", actor)).rejects.toThrow("motif");
    const cancelled = await changeStatus(db, intervention.id, "cancelled", actor, { cancelReason: "Doublon" });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelledAt).not.toBeNull();
  });

  it("un recalcul crée une nouvelle révision sans toucher à l'ancienne", async () => {
    const { createEstimate } = await import("@/server/quotes/service");
    const { attachQuoteRevision, getInterventionDetail } = await import("@/server/interventions/service");
    const { outcome, intervention } = await newIntervention();
    const recalc = await createEstimate(request({ vehicleCategory: "suv" }), { channel: "admin", source: "recalc" });
    await db.transaction((tx) => attachQuoteRevision(tx, intervention.id, recalc.quoteId as string, actor, "Nouveau calcul du prix"));

    const detail = await getInterventionDetail(db, intervention.id);
    expect(detail?.quotes).toHaveLength(2);
    expect(detail?.current?.revision).toBe(2);
    expect(detail?.intervention.vehicleCategory).toBe("suv");
    expect(detail?.intervention.currentPriceCents).toBe(recalc.result?.totals.priceTtcCents);
    const first = detail?.quotes.find((q) => q.id === outcome.quoteId);
    expect(first?.status).toBe("superseded");
    expect(first?.priceTtcCents).toBe(outcome.result?.totals.priceTtcCents);
    expect(detail?.events.some((event) => event.type === "recalculated")).toBe(true);
  });

  it("le site public n'affiche pas de prix sans destination, mais la demande reste possible", async () => {
    const { createEstimate } = await import("@/server/quotes/service");
    const outcome = await createEstimate(request({ dropoff: { kind: "unknown" } }), { channel: "online", source: "web" });
    expect(outcome.client.priceTtcCents).toBeNull();
    expect(outcome.client.message).toBeTruthy();
    expect(outcome.quoteId).not.toBeNull();
  });
});

describe("paramètres", () => {
  it("journalise chaque modification et crée une version des tarifs seulement si le calcul est concerné", async () => {
    const { saveSettingsSection } = await import("@/server/settings/admin");
    const { getLatestVersion } = await import("@/server/settings/versions");
    const { auditLog } = await import("@/server/db/schema");
    const before = await getLatestVersion(db);

    const phone = await saveSettingsSection(db, "company", { "company.phone": "01 23 45 67 89" }, actor);
    expect(phone).toEqual({ ok: true, changeCount: 1, versionNumber: null });
    expect((await getLatestVersion(db))?.versionNumber).toBe(before?.versionNumber);

    const zone = await saveSettingsSection(db, "zone", { "zone.maxApproachKm": 60 }, actor);
    expect(zone.ok && zone.versionNumber).toBe((before?.versionNumber ?? 0) + 1);
    expect((await getLatestVersion(db))?.snapshot.pricing.zone.maxApproachKm).toBe(60);

    const unchanged = await saveSettingsSection(db, "zone", { "zone.maxApproachKm": 60 }, actor);
    expect(unchanged).toEqual({ ok: true, changeCount: 0, versionNumber: null });

    const rows = await db.select().from(auditLog);
    expect(rows.find((row) => row.entityId === "company.phone")?.displayNew).toBe("01 23 45 67 89");
  });

  it("refuse les valeurs invalides et les réglages d'une autre section", async () => {
    const { saveSettingsSection } = await import("@/server/settings/admin");
    expect((await saveSettingsSection(db, "company", { "company.phone": "abc" }, actor)).ok).toBe(false);
    expect((await saveSettingsSection(db, "company", { "pricing.minimum.amountCents": 1 }, actor)).ok).toBe(false);
    expect((await saveSettingsSection(db, "base", { "pricing.minimum.amountCents": 1 }, actor)).ok).toBe(false);
  });
});

describe("photos", () => {
  it("jeton temporaire, nettoyage des métadonnées et nombre limité", async () => {
    const { issuePhotoToken, interventionForPhotoToken, savePhoto, listPhotos, getPhoto, PHOTO_LIMITS } = await import("@/server/photos/service");
    const { BASELINE_JPEG, jpegBytes } = await import("@/server/photos/test-fixtures");
    const { intervention } = await newIntervention("web");

    const token = await issuePhotoToken(db, intervention.id);
    expect((await interventionForPhotoToken(db, token))?.id).toBe(intervention.id);
    expect(await interventionForPhotoToken(db, "x".repeat(32))).toBeNull();
    expect(await interventionForPhotoToken(db, "court")).toBeNull();

    const saved = await savePhoto(db, intervention.id, jpegBytes(BASELINE_JPEG), "client");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const stored = await getPhoto(db, intervention.id, saved.id);
    expect(stored?.width).toBe(40);
    expect(Buffer.from(stored?.data ?? []).includes(Buffer.from("Exif"))).toBe(false);

    expect((await savePhoto(db, intervention.id, new Uint8Array([1, 2, 3]), "client")).ok).toBe(false);
    for (let i = 1; i < PHOTO_LIMITS.perIntervention; i++) await savePhoto(db, intervention.id, jpegBytes(BASELINE_JPEG), "admin");
    expect(await listPhotos(db, intervention.id)).toHaveLength(PHOTO_LIMITS.perIntervention);
    const refused = await savePhoto(db, intervention.id, jpegBytes(BASELINE_JPEG), "admin");
    expect(refused.ok === false && refused.status).toBe(409);
  });
});

describe("entretien automatique", () => {
  it("ne tourne qu'une fois par période, sauf demande explicite", async () => {
    const { runMaintenance } = await import("@/server/maintenance");
    const first = await runMaintenance(db);
    expect(first.ran).toBe(true);
    expect(first.steps.carburant).toBe("mode manuel");
    expect((await runMaintenance(db)).ran).toBe(false);
    expect((await runMaintenance(db, { force: true })).ran).toBe(true);
  });
});
