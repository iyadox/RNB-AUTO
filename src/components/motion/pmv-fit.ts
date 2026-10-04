/**
 * Pmv (P13) : largeur d'un message en LED, en `em`, calculée sans navigateur (même résultat au
 * serveur et au client). Le panneau en déduit la taille des LED qui fait tenir son plus long
 * message sur sa largeur (container query), sans jamais descendre sous 20 px.
 *
 * Avances mesurées sur Archivo (graisse 900, capitales), en em, pour deux largeurs de police :
 * `wide` (wdth 100, interlettre 0,08 em : ordinateur et tablette) et `narrow` (wdth 75,
 * interlettre 0,04 em : panneaux étroits, téléphones).
 */

export type LedStyle = "wide" | "narrow";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈÊÀÂÎÔÛÇ0123456789 '’·.,:-?!/&()€%";
// Avances dans l'ordre de CHARS (centièmes d'em).
const WIDE = [
  78, 77, 78, 78, 72, 66, 82, 82, 36, 66, 83, 66, 96, 82, 83, 71, 83, 78, 72, 72, 82, 78, 100, 78, 78, 72, 72, 72, 72, 78, 78, 36,
  83, 82, 78, 67, 67, 67, 67, 67, 67, 67, 66, 67, 67, 18, 28, 29, 33, 33, 33, 33, 33, 62, 34, 31, 89, 39, 40, 66, 100,
];
const NARROW = [
  62, 59, 60, 60, 55, 49, 63, 62, 30, 52, 62, 51, 79, 62, 65, 56, 65, 60, 57, 56, 62, 59, 82, 60, 58, 56, 55, 55, 55, 62, 62, 30,
  65, 62, 60, 52, 47, 51, 52, 51, 52, 52, 48, 51, 52, 13, 24, 23, 26, 27, 27, 27, 27, 49, 28, 29, 68, 39, 40, 53, 82,
];
const TRACKING: Record<LedStyle, number> = { wide: 0.08, narrow: 0.04 };
const FALLBACK: Record<LedStyle, number> = { wide: 0.8, narrow: 0.62 };
/** Marge de sécurité (approximations des signes rares, crénage). */
const SAFETY = 1.03;

const table = (style: LedStyle) => {
  const values = style === "wide" ? WIDE : NARROW;
  return new Map(Array.from(CHARS).map((c, i) => [c, (values[i] ?? 0) / 100]));
};
const TABLES: Record<LedStyle, Map<string, number>> = { wide: table("wide"), narrow: table("narrow") };

/** Largeur d'un texte en LED, en em (capitales, interlettre compris). */
export function ledWidthEm(text: string, style: LedStyle): number {
  const advances = TABLES[style];
  let width = 0;
  for (const char of Array.from(text.toLocaleUpperCase("fr-FR"))) {
    width += (advances.get(char) ?? FALLBACK[style]) + TRACKING[style];
  }
  return Math.round(width * SAFETY * 100) / 100;
}

/** Largeur du plus long des textes, en em (1 au minimum). */
export function longestLedEm(texts: readonly string[], style: LedStyle): number {
  return Math.max(1, ...texts.map((text) => ledWidthEm(text, style)));
}
