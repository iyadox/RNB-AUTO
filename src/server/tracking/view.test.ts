import { describe, expect, it } from "vitest";
import { buildTrackingView, PHASE_COPY, trackingLinkOpen, trackingPath, TRACKING_LIMITS, type TrackingSource } from "./view";

const T0 = new Date("2026-10-24T08:00:00Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
const DAY = 24 * 60;

const source = (overrides: Partial<TrackingSource> = {}): TrackingSource => ({
  reference: "RNB-2026-00042",
  status: "new",
  dropoffKind: "address",
  pickupCity: "Pantin",
  pickupPostcode: "93500",
  pickupAfterRegulatedRoad: false,
  dropoffCity: "Paris",
  dropoffPostcode: "75011",
  vehicleLabel: "Berline",
  estimatedPriceCents: 14_900,
  confirmedPriceCents: null,
  createdAt: T0,
  updatedAt: T0,
  completedAt: null,
  cancelledAt: null,
  ...overrides,
});

describe("suivi client : vue publique", () => {
  it("demande reçue : première étape en cours, prix estimé, dépanneuse au dépôt", () => {
    const view = buildTrackingView(source(), [{ status: "new", at: T0 }]);
    expect(view.phase).toBe("received");
    expect(view.steps.map((s) => s.key)).toEqual(["received", "confirmed", "en_route", "arrived", "transport", "completed"]);
    expect(view.steps[0]).toMatchObject({ state: "current", at: T0 });
    expect(view.steps.slice(1).every((s) => s.state === "next" && s.at === null)).toBe(true);
    expect(view.price).toEqual({ kind: "estimated", cents: 14_900 });
    expect(view.truckAt).toBe(0);
    expect(view.photosAllowed).toBe(true);
    expect(view.pickupLabel).toBe("Pantin (93500)");
    expect(view.destinationLabel).toBe("Paris (75011)");
  });

  it("« À rappeler » reste sur l'étape Reçue, avec son propre message", () => {
    const view = buildTrackingView(source({ status: "to_call_back" }), [
      { status: "new", at: T0 },
      { status: "to_call_back", at: at(5) },
    ]);
    expect(view.phase).toBe("callback");
    expect(view.title).toBe(PHASE_COPY.callback.title);
    expect(view.steps[0]).toMatchObject({ state: "current", at: T0 });
  });

  it("en route : étapes passées cochées et datées, prix confirmé prioritaire", () => {
    const view = buildTrackingView(source({ status: "en_route", confirmedPriceCents: 16_000 }), [
      { status: "new", at: T0 },
      { status: "accepted", at: at(4) },
      { status: "en_route", at: at(10) },
    ]);
    expect(view.steps.map((s) => s.state)).toEqual(["done", "done", "current", "next", "next", "next"]);
    expect(view.steps[1]?.at).toEqual(at(4));
    expect(view.steps[2]?.at).toEqual(at(10));
    expect(view.price).toEqual({ kind: "confirmed", cents: 16_000 });
    expect(view.truckAt).toBe(0.5);
    expect(view.led).toEqual(["DÉPANNEUSE", "EN ROUTE"]);
  });

  it("transport : véhicule chargé ; « Véhicule chargé » et « Transport » forment une seule étape", () => {
    const history = [
      { status: "new", at: T0 },
      { status: "accepted", at: at(1) },
      { status: "en_route", at: at(2) },
      { status: "arrived", at: at(20) },
      { status: "loaded", at: at(30) },
      { status: "in_transit", at: at(35) },
    ];
    const view = buildTrackingView(source({ status: "in_transit" }), history);
    expect(view.phase).toBe("transport");
    expect(view.truckLoaded).toBe(true);
    expect(view.truckAt).toBe(1.5);
    expect(view.steps[4]).toMatchObject({ key: "transport", state: "current", at: at(30) });
  });

  it("dépannage sur place : pas d'étape Transport, terminée chez le client", () => {
    const view = buildTrackingView(source({ status: "completed", dropoffKind: "on_site", completedAt: at(60) }), [
      { status: "new", at: T0 },
      { status: "accepted", at: at(1) },
      { status: "en_route", at: at(2) },
      { status: "arrived", at: at(20) },
      { status: "completed", at: at(60) },
    ]);
    expect(view.steps.map((s) => s.key)).toEqual(["received", "confirmed", "en_route", "arrived", "completed"]);
    expect(view.steps.every((s) => s.state === "done")).toBe(true);
    expect(view.truckAt).toBe(1);
    expect(view.truckLoaded).toBe(false);
    expect(view.stops.map((s) => s.key)).toEqual(["depot", "pickup"]);
    expect(view.destinationLabel).toBe("Dépannage sur place");
    expect(view.photosAllowed).toBe(false);
  });

  it("annulée : aucune dépanneuse, les étapes franchies restent cochées, photos fermées", () => {
    const view = buildTrackingView(source({ status: "cancelled", cancelledAt: at(8) }), [
      { status: "new", at: T0 },
      { status: "accepted", at: at(3) },
      { status: "cancelled", at: at(8) },
    ]);
    expect(view.phase).toBe("cancelled");
    expect(view.truckAt).toBeNull();
    expect(view.steps.map((s) => s.state)).toEqual(["done", "done", "next", "next", "next", "next"]);
    expect(view.closed).toBe(true);
    expect(view.photosAllowed).toBe(false);
  });

  it("demande sans prix : le prix est donné par téléphone ; destination inconnue « à préciser »", () => {
    const view = buildTrackingView(source({ estimatedPriceCents: null, dropoffKind: "unknown", dropoffCity: null, dropoffPostcode: null }), []);
    expect(view.price).toEqual({ kind: "on_call" });
    expect(view.destinationLabel).toBe("À préciser avec vous");
    expect(view.text).toMatch(/vous donner le prix/);
    // Sans journal, l'heure de la demande sert d'heure de réception.
    expect(view.steps[0]?.at).toEqual(T0);
  });

  it("étape sautée (saisie après coup) : les étapes précédentes sont cochées sans heure inventée", () => {
    const view = buildTrackingView(source({ status: "arrived" }), [
      { status: "new", at: T0 },
      { status: "arrived", at: at(25) },
    ]);
    expect(view.steps.slice(0, 4).map((s) => [s.state, s.at])).toEqual([
      ["done", T0],
      ["done", null],
      ["done", null],
      ["current", at(25)],
    ]);
  });

  it("aucune donnée personnelle dans la vue, même si la ligne de la base en contient", () => {
    const row = { ...source(), contactName: "Nom Secret", contactPhone: "+33612345678", vehiclePlate: "AB-123-CD", internalNotes: "Note interne", pickupAddress: "12 rue Cachée" };
    const text = JSON.stringify(buildTrackingView(row, []));
    for (const forbidden of ["Nom Secret", "+33612345678", "AB-123-CD", "Note interne", "rue Cachée"]) expect(text).not.toContain(forbidden);
  });
});

describe("suivi client : durée du lien", () => {
  it("ouvert tant que la demande est en cours", () => {
    expect(trackingLinkOpen(source({ status: "en_route" }), at(30 * DAY))).toBe(true);
  });

  it(`fermé ${TRACKING_LIMITS.daysAfterClosure} jours après la fin`, () => {
    const done = source({ status: "completed", completedAt: at(60) });
    expect(trackingLinkOpen(done, at(60 + TRACKING_LIMITS.daysAfterClosure * DAY - 1))).toBe(true);
    expect(trackingLinkOpen(done, at(60 + TRACKING_LIMITS.daysAfterClosure * DAY + 1))).toBe(false);
  });

  it(`fermé dans tous les cas après ${TRACKING_LIMITS.maxDays} jours`, () => {
    expect(trackingLinkOpen(source({ status: "accepted" }), at(TRACKING_LIMITS.maxDays * DAY + 1))).toBe(false);
  });

  it("chemin du lien : référence et jeton encodés", () => {
    expect(trackingPath("RNB-2026-00042", "abc_DEF-123")).toBe("/suivi/RNB-2026-00042?t=abc_DEF-123");
  });
});
