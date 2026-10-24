import { describe, expect, it } from "vitest";
import { actFor, actProgress, coverProgress, storyProgress, storyTime, type StoryGeometry } from "./story-progress";

describe("storyProgress (phase collante de la piste)", () => {
  it("vaut 0 avant la piste et 1 après", () => {
    expect(storyProgress(500, 5000, 800)).toBe(0);
    expect(storyProgress(0, 5000, 800)).toBe(0);
    expect(storyProgress(-4200, 5000, 800)).toBe(1);
    expect(storyProgress(-9000, 5000, 800)).toBe(1);
  });

  it("suit la phase collante linéairement", () => {
    expect(storyProgress(-2100, 5000, 800)).toBeCloseTo(0.5);
    expect(storyProgress(-1050, 5000, 800)).toBeCloseTo(0.25);
  });

  it("reste bornée si la piste est plus courte que l'écran", () => {
    expect(storyProgress(100, 600, 800)).toBe(0);
    expect(storyProgress(-10, 600, 800)).toBe(1);
  });
});

describe("coverProgress (fenêtre d'un acte)", () => {
  it("va de l'entrée par le bas à la sortie par le haut", () => {
    expect(coverProgress(800, 600, 800)).toBe(0);
    expect(coverProgress(100, 600, 800)).toBeCloseTo(0.5);
    expect(coverProgress(-600, 600, 800)).toBe(1);
    expect(coverProgress(2000, 600, 800)).toBe(0);
  });
});

describe("actProgress", () => {
  const geometry: StoryGeometry = {
    viewport: 800,
    track: { top: 1000, height: 9000 },
    windows: [
      { top: 2000, height: 800 },
      { top: 5000, height: 700 },
      { top: 8000, height: 800 },
    ],
  };

  it("lit la piste pour l'acte 0 et chaque fenêtre pour les actes 1 à 3", () => {
    expect(actProgress(1000, geometry, 0)).toBe(0);
    expect(actProgress(1000 + 8200 / 2, geometry, 0)).toBeCloseTo(0.5);
    expect(actProgress(2000, geometry, 1)).toBeCloseTo(0.5);
    expect(actProgress(4200, geometry, 2)).toBe(0);
    expect(actProgress(9000, geometry, 3)).toBe(1);
    expect(actProgress(9000, geometry, 4)).toBe(0);
  });
});

describe("storyTime", () => {
  it("reste avant le début à 0, puis va de 0 à 1 000 ms", () => {
    expect(storyTime(0)).toBe(-1);
    expect(storyTime(-0.2)).toBe(-1);
    expect(storyTime(0.25)).toBe(250);
    expect(storyTime(1)).toBe(1000);
    expect(storyTime(3)).toBe(1000);
  });
});

describe("actFor", () => {
  it("associe chaque animation à son acte, dans l'ordre des noms", () => {
    expect(actFor("a__w2-truck, a__w3-truck", "2 3", "a__w3-truck")).toBe(3);
    expect(actFor("a__w2-truck, a__w3-truck", " 2 3", "a__w2-truck")).toBe(2);
    expect(actFor("a__t-dawn", "0", "a__t-dawn")).toBe(0);
    expect(actFor("a__x", "", "a__x")).toBe(0);
    expect(actFor("a__x", "1", "a__inconnue")).toBe(0);
  });
});

describe("chorégraphie CSS", () => {
  it("n'utilise aucune variable comme courbe dans les images clés (elle retomberait sur « ease »)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const css = readFileSync(join(__dirname, "story.module.css"), "utf8");
    expect(css).not.toMatch(/animation-timing-function:\s*var\(/);
  });
});
