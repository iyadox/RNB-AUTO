import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou : le moteur ne contient que des mécanismes. Un montant, un pourcentage ou une
 * distance écrits en dur (ex. 45, 2500, 220) font échouer ce test : ils doivent venir des réglages.
 * Seules les constantes techniques de conversion sont admises.
 */
const TECHNICAL = new Set([60, 100, 1000, 10_000]);
const dir = path.dirname(fileURLToPath(import.meta.url));

function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

describe("moteur tarifaire sans valeur commerciale", () => {
  const files = readdirSync(dir).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "test-fixtures.ts");

  it("analyse bien les fichiers du moteur", () => {
    expect(files).toEqual(expect.arrayContaining(["engine.ts", "stages.ts", "pipeline.ts"]));
  });

  for (const file of files) {
    it(`${file} ne contient aucun montant écrit en dur`, () => {
      const code = codeOnly(readFileSync(path.join(dir, file), "utf8"));
      const literals = [...code.matchAll(/(?<![\w.$])(\d[\d_]*(?:\.\d+)?)(?![\w.])/g)].map((match) => Number((match[1] ?? "").replace(/_/g, "")));
      expect(literals.filter((value) => value > 10 && !TECHNICAL.has(value))).toEqual([]);
    });
  }
});
