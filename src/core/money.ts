/**
 * Conventions monétaires du projet :
 * - montants en centimes entiers (suffixe `Cents`) ;
 * - prix du carburant en millièmes d'euro par litre (suffixe `Millis`) ;
 * - pourcentages en points de base (suffixe `Bp`, 1 % = 100).
 */

/** Supprime le bruit des calculs en virgule flottante (ex. 2706.0000000000005). */
function snap(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Arrondi commercial : la moitié s'éloigne de zéro (2,5 → 3 ; −2,5 → −3). */
export function roundHalfAwayFromZero(value: number): number {
  const abs = Math.abs(snap(value));
  const rounded = Math.floor(abs + 0.5);
  return value < 0 ? -rounded : rounded;
}

/** Montant en centimes multiplié par un pourcentage exprimé en points de base. */
export function percentOf(cents: number, bp: number): number {
  return roundHalfAwayFromZero((cents * bp) / 10_000);
}

/** Arrondit un montant au multiple de `stepCents`, au plus proche ou toujours vers le haut. */
export function roundToStep(cents: number, stepCents: number, mode: "nearest" | "up"): number {
  if (stepCents <= 1) return Math.round(cents);
  const ratio = snap(cents / stepCents);
  const steps = mode === "up" ? Math.ceil(ratio) : roundHalfAwayFromZero(ratio);
  return steps * stepCents;
}

/** Montant TTC → HT pour un taux de TVA donné. */
export function ttcToHt(ttcCents: number, rateBp: number): number {
  return roundHalfAwayFromZero((ttcCents * 10_000) / (10_000 + rateBp));
}

/** Montant HT → TTC pour un taux de TVA donné. */
export function htToTtc(htCents: number, rateBp: number): number {
  return roundHalfAwayFromZero((htCents * (10_000 + rateBp)) / 10_000);
}

/**
 * Lit un montant saisi par une personne (« 45 », « 45,50 », « 1 234,5 € », « 45.5 »)
 * et renvoie des centimes, ou `null` si la saisie n'est pas un montant.
 */
export function parseEurosToCents(input: string): number | null {
  const cleaned = input
    .replace(/[\s  ]/g, "")
    .replace(/€/g, "")
    .replace(",", ".");
  if (cleaned === "" || !/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return roundHalfAwayFromZero(Number.parseFloat(cleaned) * 100);
}

/** Lit un nombre décimal saisi en français (« 13,5 »). */
export function parseFrenchNumber(input: string, maxDecimals = 3): number | null {
  const cleaned = input.replace(/[\s  ]/g, "").replace(",", ".");
  const pattern = new RegExp(`^-?\\d+(\\.\\d{0,${maxDecimals}})?$`);
  if (cleaned === "" || !pattern.test(cleaned)) return null;
  return Number.parseFloat(cleaned);
}
