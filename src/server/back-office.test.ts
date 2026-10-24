/**
 * Back-office : historique des statuts, journal, appels, filtres de la liste, tableau de bord,
 * veille des nouvelles demandes et comptes. Base PGlite en mémoire, trajets simulés.
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
  when: { kind: "simulated", isoWeekday: 2, time: "14:00", holiday: false },
};

beforeAll(async () => {
  const { getDb } = await import("@/server/db/client");
  db = await getDb();
}, 120_000);

async function newIntervention(name: string, source: "web" | "phone" = "web") {
  const { createEstimate, getQuote } = await import("@/server/quotes/service");
  const { createInterventionFromQuote } = await import("@/server/interventions/service");
  const outcome = await createEstimate(request, { channel: source === "web" ? "online" : "admin", source });
  const quote = await getQuote(db, outcome.quoteId as string);
  if (!quote) throw new Error("estimation absente");
  return db.transaction((tx) =>
    createInterventionFromQuote(tx, quote, {
      source,
      contact: { name, phone: "06 98 76 54 32", email: null },
      vehicle: { brand: "Peugeot", model: "308", plate: "AB-123-CD" },
      comment: null,
      actor,
    }),
  );
}

describe("historique des statuts", () => {
  it("donne chaque statut avec son heure, du plus ancien au plus récent, sans donnée personnelle", async () => {
    const { changeStatus, getStatusHistory, addJournalNote } = await import("@/server/interventions/service");
    const it1 = await newIntervention("Histoire Un");
    await changeStatus(db, it1.id, "accepted", actor);
    await addJournalNote(db, it1.id, "Code portail 1234", actor);
    await changeStatus(db, it1.id, "en_route", actor);
    const history = await getStatusHistory(db, it1.id);
    expect(history.map((h) => h.status)).toEqual(["new", "accepted", "en_route"]);
    for (let i = 1; i < history.length; i++) expect(history[i]!.at.getTime()).toBeGreaterThanOrEqual(history[i - 1]!.at.getTime());
    expect(Object.keys(history[0]!).sort()).toEqual(["at", "status"]);
    expect(JSON.stringify(history)).not.toContain("1234");
  });

  it("note les appels : « pas de réponse » passe une nouvelle demande à rappeler", async () => {
    const { logCall, getIntervention, getInterventionDetail, getStatusHistory } = await import("@/server/interventions/service");
    const it2 = await newIntervention("Appel Deux");
    expect((await logCall(db, it2.id, "no_answer", actor)).movedToCallBack).toBe(true);
    expect((await getIntervention(db, it2.id))?.status).toBe("to_call_back");
    expect((await logCall(db, it2.id, "reached", actor)).movedToCallBack).toBe(false);
    const detail = await getInterventionDetail(db, it2.id);
    expect(detail?.events.filter((e) => e.type === "call")).toHaveLength(2);
    expect((await getStatusHistory(db, it2.id)).map((h) => h.status)).toEqual(["new", "to_call_back"]);
  });

  it("refuse une note sur une demande inconnue", async () => {
    const { addJournalNote } = await import("@/server/interventions/service");
    await expect(addJournalNote(db, "00000000-0000-4000-8000-000000000000", "x", actor)).rejects.toThrow("introuvable");
  });
});

describe("liste des demandes", () => {
  it("filtre par statuts, origine, date et recherche, et compte le total", async () => {
    const { listInterventions, countInterventions } = await import("@/server/interventions/service");
    await newIntervention("Filtre Téléphone", "phone");
    const phone = await listInterventions(db, { statuses: null, sources: ["phone", "admin"] });
    expect(phone.every((row) => row.source !== "web")).toBe(true);
    expect(phone.some((row) => row.contactName === "Filtre Téléphone")).toBe(true);
    expect(await countInterventions(db, { statuses: ["to_call_back"] })).toBeGreaterThanOrEqual(1);
    expect(await countInterventions(db, { statuses: null, since: new Date(Date.now() + 3600_000) })).toBe(0);
    const found = await listInterventions(db, { statuses: null, search: "98 76 54" });
    expect(found.length).toBeGreaterThan(0);
    expect(await listInterventions(db, { statuses: null, search: "%%%" })).toHaveLength(await countInterventions(db, { statuses: null }));
  });
});

describe("tableau de bord", () => {
  it("compte le chiffre d'affaires sur les prix confirmés des interventions terminées", async () => {
    const { changeStatus, getIntervention } = await import("@/server/interventions/service");
    const { loadDashboard, watchSummary } = await import("@/server/interventions/dashboard");
    const before = await loadDashboard(db);
    const done = await newIntervention("Terminé Trois");
    for (const status of ["accepted", "en_route", "arrived", "loaded", "in_transit", "completed"] as const) await changeStatus(db, done.id, status, actor);
    const price = (await getIntervention(db, done.id))?.confirmedPriceCents ?? 0;
    expect(price).toBeGreaterThan(0);
    const after = await loadDashboard(db);
    expect(after.revenue.day.cents - before.revenue.day.cents).toBe(price);
    expect(after.revenue.month.count - before.revenue.month.count).toBe(1);
    expect(after.revenue.lastDays).toHaveLength(7);
    expect(after.open.every((row) => row.status !== "completed" && row.status !== "cancelled")).toBe(true);
    expect(after.createdToday).toBeGreaterThan(0);

    const watch = await watchSummary(db);
    expect(watch.newCount).toBe(after.counts.new ?? 0);
    expect(watch.latest?.reference).toMatch(/^RNB-/);
  });
});

describe("comptes et appareils", () => {
  it("donne et suspend un accès, sans jamais supprimer le dernier", async () => {
    const { createAccount, setAccountActive, listAccounts, recentAccessChanges, AccountError } = await import("@/server/auth/accounts");
    const { users } = await import("@/server/db/schema");
    const [first] = await db.insert(users).values({ name: "Patron", email: "patron@exemple.test", passwordHash: "x" }).returning();
    const me = { userId: first!.id, label: "Patron" };
    await expect(createAccount(db, { name: "Aide", email: "aide@exemple.test", password: "court" }, me)).rejects.toBeInstanceOf(AccountError);
    const id = await createAccount(db, { name: "Aide", email: "Aide@Exemple.test", password: "Une phrase 2026 solide" }, me);
    await expect(createAccount(db, { name: "Aide", email: "aide@exemple.test", password: "Une phrase 2026 solide" }, me)).rejects.toThrow("déjà");
    expect((await listAccounts(db)).find((a) => a.id === id)?.email).toBe("aide@exemple.test");

    await expect(setAccountActive(db, me.userId, false, me)).rejects.toThrow("propre accès");
    await setAccountActive(db, id, false, me);
    expect((await listAccounts(db)).find((a) => a.id === id)?.active).toBe(false);
    // Le patron est maintenant le seul accès actif : l'aide ne peut pas le suspendre.
    await expect(setAccountActive(db, me.userId, false, { userId: id, label: "Aide" })).rejects.toThrow("au moins un accès");
    expect((await recentAccessChanges(db)).length).toBeGreaterThanOrEqual(2);
  });

  it("donne un nouveau mot de passe à une autre personne et la déconnecte", async () => {
    const { createAccount, resetAccountPassword, recentAccessChanges } = await import("@/server/auth/accounts");
    const { verifyPassword } = await import("@/server/auth/password");
    const { sessions, users } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    const [boss] = await db.insert(users).values({ name: "Chef", email: "chef@exemple.test", passwordHash: "x" }).returning();
    const me = { userId: boss!.id, label: "Chef" };
    const id = await createAccount(db, { name: "Oublieux", email: "oublieux@exemple.test", password: "Une phrase 2026 solide" }, me);
    await db.insert(sessions).values({ id: "c".repeat(64), userId: id, expiresAt: new Date(Date.now() + 86_400_000) });
    await expect(resetAccountPassword(db, me.userId, "Encore 2026 solide", me)).rejects.toThrow("Mon compte");
    await expect(resetAccountPassword(db, id, "court", me)).rejects.toThrow();
    await resetAccountPassword(db, id, "Nouvelle phrase 2026", me);
    const [row] = await db.select().from(users).where(eq(users.id, id));
    expect(await verifyPassword("Nouvelle phrase 2026", row!.passwordHash)).toBe(true);
    expect(await db.select().from(sessions).where(eq(sessions.userId, id))).toHaveLength(0);
    const changes = await recentAccessChanges(db);
    expect(changes.some((c) => c.field === "password" && c.entityId === id)).toBe(true);
    expect(JSON.stringify(changes)).not.toContain("Nouvelle phrase 2026");
  });

  it("liste et déconnecte les appareils, jamais celui utilisé", async () => {
    const { listDevices, revokeDevice, sessionRef } = await import("@/server/auth/accounts");
    const { sessions, users } = await import("@/server/db/schema");
    const [user] = await db.insert(users).values({ name: "Mobile", email: "mobile@exemple.test", passwordHash: "x" }).returning();
    const expiresAt = new Date(Date.now() + 86_400_000);
    await db.insert(sessions).values([
      { id: "a".repeat(64), userId: user!.id, expiresAt, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Safari/604.1" },
      { id: "b".repeat(64), userId: user!.id, expiresAt, userAgent: null },
    ]);
    const devices = await listDevices(db, user!.id, "a".repeat(64));
    expect(devices).toHaveLength(2);
    expect(devices.find((d) => d.current)?.device).toBe("iPhone · Safari");
    expect(devices.every((d) => d.ref.length === 16)).toBe(true);
    await expect(revokeDevice(db, user!.id, sessionRef("a".repeat(64)), "a".repeat(64))).rejects.toThrow();
    expect(await revokeDevice(db, user!.id, sessionRef("b".repeat(64)), "a".repeat(64))).toBe(true);
    expect(await listDevices(db, user!.id, "a".repeat(64))).toHaveLength(1);
  });
});

describe("email de nouvelle demande", () => {
  it("échappe toutes les données", async () => {
    const { newRequestEmailHtml } = await import("@/server/notifications/email-template");
    const html = newRequestEmailHtml({
      companyName: "RNB AUTO",
      reference: "RNB-2026-00001",
      contactName: "<script>alert(1)</script>",
      contactPhone: "06 12 34 56 78",
      pickup: "Pantin",
      destination: "Paris",
      vehicle: "Berline",
      problem: "Panne",
      estimate: null,
      url: "https://exemple.fr/admin/demandes/1",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('href="tel:0612345678"');
  });
});

describe("lien de suivi créé depuis l'espace", () => {
  it("donne un lien qui ouvre le suivi de CETTE demande, sans garder le jeton en clair", async () => {
    const { issueTrackingLinkByStaff } = await import("@/server/interventions/tracking-link");
    const { findTrackedIntervention } = await import("@/server/tracking/token");
    const { getInterventionDetail } = await import("@/server/interventions/service");
    const phoneRequest = await newIntervention("Suivi Téléphone", "phone");
    const other = await newIntervention("Autre Client");
    const { path, reference } = await issueTrackingLinkByStaff(db, phoneRequest.id, { userId: null, label: "Accueil" });
    expect(reference).toBe(phoneRequest.reference);
    const token = new URL(path, "http://exemple.test").searchParams.get("t") ?? "";
    const found = await findTrackedIntervention(db, phoneRequest.reference, token);
    expect(found.ok && found.intervention.id).toBe(phoneRequest.id);
    // Le même jeton ne donne rien sur une autre demande.
    expect((await findTrackedIntervention(db, other.reference, token)).ok).toBe(false);
    const detail = await getInterventionDetail(db, phoneRequest.id);
    expect(JSON.stringify(detail?.events)).not.toContain(token);
    expect(detail?.events.some((e) => e.type === "tracking" && e.byLabel === "Accueil")).toBe(true);
  });

  it("refuse une demande close depuis trop longtemps", async () => {
    const { issueTrackingLinkByStaff } = await import("@/server/interventions/tracking-link");
    const old = await newIntervention("Ancien Client");
    const later = new Date(Date.now() + 90 * 24 * 3600 * 1000);
    await expect(issueTrackingLinkByStaff(db, old.id, actor, later)).rejects.toThrow(/plus disponible/);
  });
});
