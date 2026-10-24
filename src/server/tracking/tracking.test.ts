/**
 * Suivi client, sur une base PostgreSQL embarquée en mémoire (PGlite) et des trajets simulés :
 * lien de suivi (jeton haché), lecture de la vue publique, demande sans prix en cas de panne.
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { QuoteRequestInput } from "@/core/quotes/types";
import type { Db } from "@/server/db/client";

process.env.DATABASE_URL = "pglite:memory://";
process.env.GEO_PROVIDER = "simulation";

const actor = { userId: null, label: "Test" };
let db: Db;

const request: QuoteRequestInput = {
  pickup: { label: "Drancy", lat: 48.9297, lng: 2.4458, postcode: "93700", city: "Drancy", source: "search", afterRegulatedRoad: false, handoverNote: null },
  dropoff: { kind: "address", place: { label: "Pantin", lat: 48.8944, lng: 2.4094, postcode: "93500", city: "Pantin", source: "search" } },
  vehicleCategory: "berline",
  situations: ["breakdown"],
  when: { kind: "now" },
};

beforeAll(async () => {
  const { getDb } = await import("@/server/db/client");
  db = await getDb();
}, 120_000);

async function webIntervention(input: QuoteRequestInput = request, unpriced = false) {
  const { createEstimate, getQuote } = await import("@/server/quotes/service");
  const { createInterventionFromQuote } = await import("@/server/interventions/service");
  const { createUnpricedEstimate } = await import("./unpriced");
  const quoteId = unpriced ? (await createUnpricedEstimate(db, input)).quoteId : (await createEstimate(input, { channel: "online", source: "web" })).quoteId;
  const quote = await getQuote(db, quoteId as string);
  if (!quote) throw new Error("estimation absente");
  return createInterventionFromQuote(db, quote, {
    source: "web",
    contact: { name: "Nom Secret", phone: "06 12 34 56 78", email: null },
    vehicle: { brand: null, model: null, plate: "AB-123-CD" },
    comment: null,
    actor,
  });
}

describe("lien de suivi", () => {
  it("le bon jeton ouvre la demande ; seul son empreinte est enregistrée", async () => {
    const { issueTrackingToken, findTrackedIntervention, hashTrackingToken } = await import("./token");
    const { interventionEvents } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    const intervention = await webIntervention();
    const token = await issueTrackingToken(db, intervention.id);
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const found = await findTrackedIntervention(db, intervention.reference, token);
    expect(found.ok && found.intervention.id).toBe(intervention.id);

    const events = await db.select().from(interventionEvents).where(eq(interventionEvents.interventionId, intervention.id));
    const stored = JSON.stringify(events);
    expect(stored).not.toContain(token);
    expect(stored).toContain(hashTrackingToken(token));
  });

  it("un faux jeton, le jeton d'une autre demande ou une référence mal formée ne donnent rien", async () => {
    const { issueTrackingToken, findTrackedIntervention } = await import("./token");
    const first = await webIntervention();
    const second = await webIntervention();
    const tokenOfSecond = await issueTrackingToken(db, second.id);
    await issueTrackingToken(db, first.id);
    expect(await findTrackedIntervention(db, first.reference, tokenOfSecond)).toEqual({ ok: false, reason: "invalid" });
    expect(await findTrackedIntervention(db, first.reference, "x".repeat(32))).toEqual({ ok: false, reason: "invalid" });
    expect(await findTrackedIntervention(db, "'; drop table x", tokenOfSecond)).toEqual({ ok: false, reason: "invalid" });
  });

  it("la vue suit les statuts et ne contient aucune donnée personnelle", async () => {
    const { issueTrackingToken } = await import("./token");
    const { loadTracking } = await import("./service");
    const { changeStatus } = await import("@/server/interventions/service");
    const intervention = await webIntervention();
    const token = await issueTrackingToken(db, intervention.id);

    let data = await loadTracking(intervention.reference, token);
    expect(data.ok && data.view.phase).toBe("received");
    expect(data.ok && data.view.price.kind).toBe("estimated");

    await changeStatus(db, intervention.id, "accepted", actor);
    await changeStatus(db, intervention.id, "en_route", actor);
    data = await loadTracking(intervention.reference, token);
    if (!data.ok) throw new Error(data.reason);
    expect(data.view.phase).toBe("en_route");
    expect(data.view.price.kind).toBe("confirmed");
    expect(data.view.steps.filter((s) => s.state === "done").map((s) => s.key)).toEqual(["received", "confirmed"]);
    const text = JSON.stringify(data);
    for (const forbidden of ["Nom Secret", "612345678", "AB-123-CD"]) expect(text).not.toContain(forbidden);
  });
});

describe("panne de l'estimation", () => {
  it("la demande part quand même, sans prix, et l'administration le sait", async () => {
    const { UNPRICED_REASON } = await import("./unpriced");
    const { getQuote } = await import("@/server/quotes/service");
    const intervention = await webIntervention(request, true);
    expect(intervention.estimatedPriceCents).toBeNull();
    expect(intervention.currentPriceCents).toBeNull();
    const quote = await getQuote(db, intervention.currentQuoteId as string);
    expect(quote?.hiddenReason).toBe(UNPRICED_REASON);
    expect(quote?.status).toBe("used");
  });
});
