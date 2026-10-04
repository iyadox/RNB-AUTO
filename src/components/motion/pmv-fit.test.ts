import { describe, expect, it } from "vitest";
import { ledWidthEm, longestLedEm } from "./pmv-fit";

describe("largeur des messages du Pmv (P13)", () => {
  it("donne une largeur proche de la mesure réelle (Archivo 900, capitales)", () => {
    // Mesuré dans Chromium à 20 px : 336,2 px en police large (wdth 100, interlettre 0,08 em).
    const em = ledWidthEm("CONFIRMÉ PAR TÉLÉPHONE", "wide");
    expect(em * 20).toBeGreaterThanOrEqual(336);
    expect(em * 20).toBeLessThan(336 * 1.06);
  });
  it("la police étroite est plus courte que la large", () => {
    expect(ledWidthEm("EN MOINS D'UNE MINUTE", "narrow")).toBeLessThan(ledWidthEm("EN MOINS D'UNE MINUTE", "wide") * 0.85);
  });
  it("ignore la casse et reste prudente sur un signe inconnu", () => {
    expect(ledWidthEm("paris", "wide")).toBe(ledWidthEm("PARIS", "wide"));
    expect(ledWidthEm("@", "wide")).toBeGreaterThan(0.8);
  });
  it("les messages du portique tiennent à 360 px en LED de 20 px", () => {
    // Portique de l'accueil à 360 px : 304 px de panneau, 288 px de caisson, 10 px de marge de chaque côté.
    const available = 288 - 2 * 10;
    const em = longestLedEm(["PRIX ESTIMÉ", "EN MOINS D'UNE MINUTE", "CONFIRMÉ PAR TÉLÉPHONE", "AVANT LE DÉPART", "PARIS · ÎLE-DE-FRANCE"], "narrow");
    expect(em * 20).toBeLessThanOrEqual(available);
  });
});
