import { describe, expect, it } from "vitest";
import { planPoint } from "@/components/scenes/kit/plan-idf/plan-geometry";
import { depotInSeineSaintDenis, planToGeo } from "./home-geo";

describe("depotInSeineSaintDenis", () => {
  it("reconnaît un code postal du 93 dans l'adresse", () => {
    expect(depotInSeineSaintDenis({ label: "145 rue de Paris, 93000 Bobigny", city: "Bobigny" })).toBe(true);
    expect(depotInSeineSaintDenis({ label: "12 avenue X, 93100 Montreuil", city: null })).toBe(true);
  });
  it("reconnaît une ville connue du 93 sans code postal", () => {
    expect(depotInSeineSaintDenis({ label: "Dépôt", city: "Pantin" })).toBe(true);
  });
  it("refuse un dépôt hors du 93", () => {
    expect(depotInSeineSaintDenis({ label: "3 rue Y, 94000 Créteil", city: "Créteil" })).toBe(false);
    expect(depotInSeineSaintDenis({ label: "1 rue Z, 75011 Paris", city: "Paris" })).toBe(false);
    expect(depotInSeineSaintDenis({ label: "", city: null })).toBe(false);
    // « 93 » dans un numéro de rue n'est pas un code postal.
    expect(depotInSeineSaintDenis({ label: "930 route de Lyon, 77000 Melun", city: "Melun" })).toBe(false);
  });
});

describe("planToGeo", () => {
  const depots = [
    { label: "Bobigny", city: "Bobigny", lat: null, lng: null },
    { label: "Dépôt", city: null, lat: 48.85, lng: 2.6 },
    { label: "Inconnu", city: null, lat: null, lng: null },
  ];
  it("est l'inverse de planPoint (variante depot)", () => {
    for (const depot of depots) {
      const geo = planToGeo({ x: 168, y: 392 }, depot);
      const back = planPoint(geo.lat, geo.lng, "depot", depot);
      expect(back.x).toBeCloseTo(168, 6);
      expect(back.y).toBeCloseTo(392, 6);
    }
  });
});
