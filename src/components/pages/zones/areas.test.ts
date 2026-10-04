import { describe, expect, it } from "vitest";
import { AREAS, matchPlace, normalizePlace, placeSlug } from "./areas";

describe("recherche de commune (/zones-d-intervention)", () => {
  it("trouve une commune sans tenir compte des accents ni des majuscules", () => {
    expect(matchPlace("Pantin")).toMatchObject({ kind: "found", place: "Pantin" });
    expect(matchPlace("  pantin ")).toMatchObject({ kind: "found", place: "Pantin" });
    expect(matchPlace("epinay sur seine")).toMatchObject({ kind: "found", place: "Épinay-sur-Seine" });
    expect(matchPlace("LE PRE SAINT GERVAIS")).toMatchObject({ kind: "found", place: "Le Pré-Saint-Gervais" });
  });

  it("accepte tous les arrondissements de Paris", () => {
    expect(matchPlace("Paris")).toMatchObject({ kind: "found", place: "Paris" });
    expect(matchPlace("paris 15e")).toMatchObject({ kind: "found", place: "Paris 15e" });
    expect(matchPlace("Paris 1")).toMatchObject({ kind: "found", place: "Paris 1er" });
    expect(matchPlace("paris 21").kind).not.toBe("found");
  });

  it("propose les communes qui commencent par la saisie, d'abord par le début du nom", () => {
    const match = matchPlace("sai");
    expect(match.kind).toBe("suggest");
    if (match.kind === "suggest") expect(match.places.map((p) => p.place)).toEqual(["Saint-Denis", "Saint-Ouen", "Le Pré-Saint-Gervais"]);
  });

  it("répond « absente » pour une commune hors des listes, rien sous deux lettres", () => {
    expect(matchPlace("Lyon").kind).toBe("missing");
    expect(matchPlace("L").kind).toBe("empty");
    expect(matchPlace("").kind).toBe("empty");
  });

  it("reprend les quatre secteurs et des identifiants de puce uniques", () => {
    expect(AREAS.map((a) => a.zone)).toEqual(["93", "paris", "petite-couronne", "grande-couronne"]);
    const slugs = AREAS.flatMap((a) => a.places.map(placeSlug));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(normalizePlace("Noisy-le-Sec")).toBe("noisy le sec");
  });
});
