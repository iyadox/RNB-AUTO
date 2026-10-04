/**
 * Contrastes de la nuit (docs/09, B.2 et A5) : les ratios WCAG sont recalculés à partir des
 * jetons réellement déclarés dans globals.css. Si une couleur change, ce test dit quelle paire
 * de texte devient illisible.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match?.[1]) throw new Error(`Jeton de couleur introuvable dans globals.css : --color-${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Ratio de contraste WCAG 2.x entre deux jetons. */
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const SKIES = ["night-950", "night-900", "dusk-700", "dusk-500", "blueprint"] as const;
const INKS = ["signal-500", "chalk", "asphalt-200", "asphalt-300", "asphalt-400", "beacon-500"] as const;

/** Tableau B.2, tel qu'il est publié dans le cahier (une décimale). */
const PUBLISHED: Record<(typeof SKIES)[number], number[]> = {
  "night-950": [12.6, 18.2, 12.7, 8.1, 4.7, 7.7],
  "night-900": [11.7, 16.9, 11.8, 7.6, 4.3, 7.2],
  "dusk-700": [9.0, 13.0, 9.1, 5.8, 3.3, 5.5],
  "dusk-500": [7.3, 10.6, 7.4, 4.7, 2.7, 4.5],
  blueprint: [10.3, 14.8, 10.4, 6.7, 3.8, 6.3],
};

const AA = 4.5;

describe("contrastes de la nuit (B.2)", () => {
  it("correspond au tableau publié dans le cahier", () => {
    for (const sky of SKIES) {
      INKS.forEach((ink, index) => {
        expect(Math.abs(ratio(ink, sky) - (PUBLISHED[sky][index] ?? 0)), `${ink} sur ${sky}`).toBeLessThanOrEqual(0.06);
      });
    }
  });

  it("garde le jaune, la craie et asphalt-200 lisibles sur tous les ciels", () => {
    for (const sky of SKIES) {
      for (const ink of ["signal-500", "chalk", "asphalt-200"] as const) {
        expect(ratio(ink, sky), `${ink} sur ${sky}`).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("autorise asphalt-300 comme texte courant sur minuit, nuit et l'heure bleue (A5)", () => {
    for (const sky of ["night-950", "night-900", "dusk-700", "blueprint"] as const) {
      expect(ratio("asphalt-300", sky), `asphalt-300 sur ${sky}`).toBeGreaterThanOrEqual(AA);
    }
    // À l'aube, asphalt-200 au minimum (asphalt-300 y est encore juste au-dessus du seuil).
    expect(ratio("asphalt-200", "dusk-500")).toBeGreaterThanOrEqual(AA);
  });

  it("confirme que asphalt-400 est interdit pour tout texte posé sur le ciel", () => {
    // Lisible seulement sur le noir le plus profond : la règle l'interdit partout par prudence.
    for (const sky of ["dusk-700", "dusk-500", "blueprint", "night-900"] as const) {
      expect(ratio("asphalt-400", sky), `asphalt-400 sur ${sky}`).toBeLessThan(AA);
    }
  });

  it("vérifie les autres paires de B.2", () => {
    const pairs: [string, string, number][] = [
      ["asphalt-950", "signal-500", 12.5],
      ["asphalt-950", "beacon-500", 7.6],
      ["asphalt-950", "whatsapp", 10.0],
      ["ink", "paper", 15.5],
      ["asphalt-500", "paper", 6.5],
      ["chalk", "motorway-600", 7.0],
      ["chalk", "dawn-rose", 3.7],
    ];
    for (const [fg, bg, published] of pairs) {
      expect(Math.abs(ratio(fg, bg) - published), `${fg} sur ${bg}`).toBeLessThanOrEqual(0.06);
    }
    // Texte sur les boutons et sur le ticket : AA largement atteint.
    for (const [fg, bg] of [
      ["asphalt-950", "signal-500"],
      ["asphalt-950", "beacon-500"],
      ["asphalt-950", "whatsapp"],
      ["ink", "paper"],
      ["asphalt-500", "paper"],
      ["chalk", "motorway-600"],
    ] as const) {
      expect(ratio(fg, bg), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(AA);
    }
    // Aucun texte sur la bande d'aube : la paire reste sous le seuil.
    expect(ratio("chalk", "dawn-rose")).toBeLessThan(AA);
  });

  it("garde le tampon « EXEMPLE » décoratif (beacon-600 sur papier, sous le seuil)", () => {
    expect(ratio("beacon-600", "paper")).toBeLessThan(AA);
    expect(ratio("beacon-600", "paper")).toBeGreaterThan(3);
  });
});
