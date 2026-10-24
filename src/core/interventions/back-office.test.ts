import { describe, expect, it } from "vitest";
import { parisMidnight, parisOffsetMinutes, periodStart, shiftDate } from "@/core/calendar/periods";
import { checklistProgress, setupChecklist } from "@/core/settings/checklist";
import { initialSettingsValues } from "@/core/settings/registry";
import { settingAnchor } from "@/core/settings/settings-pages";
import { customerMessage, googleMapsDirections, interventionSummary, smsHref, wazeNavigation } from "./links";
import { filtersQuery, PAGE_SIZE, parseListFilters } from "./list-filters";
import { earliestNeededDate, summarizeRevenue } from "./revenue";
import { progressIndex, progressSteps, serviceKindOf, STATUSES, STEP_LABELS } from "./status";

describe("périodes à l'heure de Paris", () => {
  it("donne le bon décalage été / hiver", () => {
    expect(parisOffsetMinutes(new Date("2026-07-01T12:00:00Z"))).toBe(120);
    expect(parisOffsetMinutes(new Date("2026-12-01T12:00:00Z"))).toBe(60);
  });

  it("calcule minuit à Paris, y compris les jours de changement d'heure", () => {
    expect(parisMidnight("2026-10-24").toISOString()).toBe("2026-10-23T22:00:00.000Z");
    // Le 25 octobre 2026, l'heure d'hiver arrive à 3 h : minuit est encore en heure d'été.
    expect(parisMidnight("2026-10-25").toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(parisMidnight("2026-10-26").toISOString()).toBe("2026-10-25T23:00:00.000Z");
    expect(parisMidnight("2026-03-29").toISOString()).toBe("2026-03-28T23:00:00.000Z");
  });

  it("commence la semaine le lundi et le mois le 1er", () => {
    const now = new Date("2026-10-28T09:00:00Z"); // mercredi
    expect(periodStart(now, "day").toISOString()).toBe("2026-10-27T23:00:00.000Z");
    expect(periodStart(now, "week").toISOString()).toBe("2026-10-25T23:00:00.000Z");
    expect(periodStart(now, "month").toISOString()).toBe("2026-09-30T22:00:00.000Z");
    // Dimanche soir à Paris = encore la même semaine.
    expect(periodStart(new Date("2026-11-01T21:30:00Z"), "week").toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("décale une date sur le calendrier", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("chiffre d'affaires du tableau de bord", () => {
  const now = new Date("2026-10-28T09:00:00Z"); // mercredi 28, 10 h à Paris
  const rows = [
    { completedAt: new Date("2026-10-28T07:00:00Z"), confirmedPriceCents: 15_000 }, // aujourd'hui
    { completedAt: new Date("2026-10-27T23:30:00Z"), confirmedPriceCents: 9_000 }, // aujourd'hui (23 h 30 UTC = 0 h 30 à Paris)
    { completedAt: new Date("2026-10-26T10:00:00Z"), confirmedPriceCents: 20_000 }, // lundi : semaine
    { completedAt: new Date("2026-10-24T10:00:00Z"), confirmedPriceCents: 30_000 }, // samedi dernier : mois
    { completedAt: new Date("2026-10-27T10:00:00Z"), confirmedPriceCents: null }, // terminé sans prix confirmé
    { completedAt: new Date("2026-09-30T10:00:00Z"), confirmedPriceCents: 99_000 }, // mois précédent
    { completedAt: null, confirmedPriceCents: 50_000 },
  ];

  it("additionne uniquement les prix confirmés, par période", () => {
    const summary = summarizeRevenue(rows, now);
    expect(summary.day).toEqual({ cents: 24_000, count: 2, unpriced: 0 });
    expect(summary.week).toEqual({ cents: 44_000, count: 4, unpriced: 1 });
    expect(summary.month).toEqual({ cents: 74_000, count: 5, unpriced: 1 });
  });

  it("donne les 7 derniers jours, du plus ancien au plus récent", () => {
    const summary = summarizeRevenue(rows, now);
    expect(summary.lastDays.map((d) => d.date)).toEqual(["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"]);
    expect(summary.lastDays.at(-1)).toEqual({ date: "2026-10-28", cents: 24_000, count: 2 });
    expect(summary.lastDays[2]).toEqual({ date: "2026-10-24", cents: 30_000, count: 1 });
  });

  it("borne la requête à la plus ancienne date utile", () => {
    expect(earliestNeededDate(now)).toBe("2026-10-01");
    expect(earliestNeededDate(new Date("2026-11-02T09:00:00Z"))).toBe("2026-10-27");
  });
});

describe("liens et messages de la fiche", () => {
  const pickup = { label: "12 rue Hoche, Pantin", lat: 48.89, lng: 2.4 };
  const dropoff = { label: "Paris 11e", lat: null, lng: null };

  it("prépare un itinéraire avec étape (prise en charge puis destination)", () => {
    const url = new URL(googleMapsDirections(dropoff, pickup));
    expect(url.searchParams.get("destination")).toBe("Paris 11e");
    expect(url.searchParams.get("waypoints")).toBe("48.89,2.4");
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(new URL(googleMapsDirections(pickup)).searchParams.has("waypoints")).toBe(false);
  });

  it("prépare Waze et le SMS", () => {
    expect(wazeNavigation(pickup)).toBe("https://waze.com/ul?ll=48.89,2.4&navigate=yes");
    expect(wazeNavigation(dropoff)).toContain("q=Paris%2011e");
    expect(smsHref("+33612345678", "Bonjour à vous")).toBe("sms:+33612345678?&body=Bonjour%20%C3%A0%20vous");
  });

  it("adapte le message au statut, sans délai inventé", () => {
    const ctx = { companyName: "RNB AUTO", reference: "RNB-2026-00012", contactName: "Karim B.", pickup: "Pantin" };
    for (const status of STATUSES) {
      const text = customerMessage(status, ctx);
      expect(text).toMatch(/^Bonjour Karim, ici RNB AUTO\./);
      expect(text).not.toMatch(/\d+\s?min/);
    }
    expect(customerMessage("en_route", ctx)).toContain("en route");
    expect(customerMessage("new", { ...ctx, contactName: "X" })).toMatch(/^Bonjour, ici/);
  });

  it("résume l'intervention pour le bon", () => {
    const text = interventionSummary({
      companyName: "RNB AUTO",
      reference: "RNB-2026-00012",
      statusLabel: "Acceptée",
      createdAt: "28/10/2026 à 10:00",
      contactName: "Client Essai",
      contactPhone: "06 12 34 56 78",
      pickup: "Pantin",
      handoverNote: null,
      destination: "Paris 11e",
      vehicle: "Berline",
      situations: ["Panne mécanique"],
      price: null,
      mapsUrl: "https://maps",
    });
    expect(text).toContain("Bon d'intervention RNB-2026-00012");
    expect(text).toContain("Prix : à confirmer");
    expect(text).not.toContain("Sur place :");
  });
});

describe("filtres de la liste des demandes", () => {
  it("revient aux valeurs par défaut pour toute valeur inconnue", () => {
    const filters = parseListFilters({ statut: "n'importe", periode: "x", origine: ["site", "appel"], n: "abc" });
    expect(filters.status.slug).toBe("en-cours");
    expect(filters.period.slug).toBe("tout");
    expect(filters.source.slug).toBe("site");
    expect(filters.limit).toBe(PAGE_SIZE);
  });

  it("borne la recherche et le nombre de lignes", () => {
    const filters = parseListFilters({ q: `  ${"a".repeat(200)} `, n: "100000" });
    expect(filters.search).toHaveLength(80);
    expect(filters.limit).toBe(500);
  });

  it("n'écrit dans l'adresse que ce qui diffère des valeurs par défaut", () => {
    const filters = parseListFilters({ statut: "a-rappeler" });
    expect(filtersQuery(filters)).toEqual({ statut: "a-rappeler" });
    expect(filtersQuery(filters, { n: "100" })).toEqual({ statut: "a-rappeler", n: "100" });
  });
});

describe("frise d'avancement", () => {
  it("a moins d'étapes pour un dépannage sur place", () => {
    expect(progressSteps("on_site")).toHaveLength(5);
    expect(progressSteps("tow")).toHaveLength(7);
    for (const step of progressSteps("tow")) expect(STEP_LABELS[step]).toBeTruthy();
  });

  it("place chaque statut sur la frise", () => {
    expect(progressIndex("to_call_back", "tow")).toBe(0);
    expect(progressIndex("en_route", "tow")).toBe(2);
    expect(progressIndex("completed", "on_site")).toBe(4);
    expect(progressIndex("loaded", "on_site")).toBe(3);
    expect(progressIndex("cancelled", "tow")).toBe(-1);
    expect(serviceKindOf("on_site")).toBe("on_site");
    expect(serviceKindOf("address")).toBe("tow");
    expect(serviceKindOf("unknown")).toBe("unknown");
  });
});

describe("ce qui manque dans les réglages", () => {
  it("liste tout ce qui manque au départ, avec un lien direct vers le champ", () => {
    const items = setupChecklist(initialSettingsValues(), { emailService: false });
    const progress = checklistProgress(items);
    expect(progress.done).toBe(0);
    expect(progress.missingRequired).toBeGreaterThan(4);
    expect(items.find((i) => i.id === "phone")?.href).toBe(`/admin/parametres/entreprise#${settingAnchor("company.phone")}`);
  });

  it("coche ce qui est rempli", () => {
    const values = initialSettingsValues();
    values["company.phone"] = "06 12 34 56 78";
    values["company.email"] = "contact@exemple.fr";
    const items = setupChecklist(values, { emailService: true });
    expect(items.find((i) => i.id === "phone")?.done).toBe(true);
    expect(items.find((i) => i.id === "whatsapp")?.done).toBe(true);
    expect(items.find((i) => i.id === "email-alerts")?.done).toBe(true);
    expect(items.find((i) => i.id === "depot")?.done).toBe(false);
  });
});
