import type { Page, TestInfo } from "@playwright/test";

/**
 * Aides communes aux recettes de la refonte immersive (`urgence.spec.ts`, `immersion.spec.ts`).
 * Une seule définition : une correction ici vaut pour les deux fichiers. `parcours.spec.ts` ne
 * les utilise pas.
 */

/** Toutes les pages publiques (la dernière est la page « Route barrée » d'une adresse inconnue). */
export const PAGES = [
  "/",
  "/depannage",
  "/remorquage",
  "/zones-d-intervention",
  "/panne-autoroute",
  "/questions-frequentes",
  "/entreprise",
  "/contact",
  "/demande",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-d-intervention",
  "/route-inconnue",
] as const;

/** Code HTTP attendu : 404 pour l'adresse inconnue, 200 ailleurs. */
export const statusOf = (path: string) => (path === "/route-inconnue" ? 404 : 200);

/** Projet « mobile » (390 × 844, écran tactile) ou « desktop » (1 440 × 900). */
export const isMobile = (testInfo: TestInfo) => testInfo.project.name !== "desktop";

/**
 * Bruit du serveur de développement (Turbopack) : course au chargement d'une feuille CSS pendant
 * la compilation à la demande. N'existe pas dans un build de production (relevé par L1a et L6b).
 */
export const DEV_NOISE = /No link element found for chunk/;

/** Largeur de référence du cahier pour le téléphone (à appeler dans `test.beforeEach`). */
export async function setReferenceViewport(page: Page, testInfo: TestInfo) {
  if (isMobile(testInfo)) await page.setViewportSize({ width: 390, height: 844 });
}

/** Attend deux images (le navigateur a appliqué les styles et dessiné). */
export async function frames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** Attend le premier moment calme du navigateur (le runtime y lance son chargement différé). */
export async function idle(page: Page) {
  await page.evaluate(
    () => new Promise<void>((resolve) => (window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 2000 }) : resolve())),
  );
}

/** Parcourt la page de haut en bas (80 % d'écran par pas) puis revient en haut. */
export async function scrollThrough(page: Page, onStep?: (step: number) => Promise<void>) {
  for (let step = 0; ; step += 1) {
    const done = await page.evaluate((index) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(max, Math.round(index * window.innerHeight * 0.8));
      window.scrollTo({ top: y, behavior: "instant" });
      return y >= max;
    }, step);
    await frames(page);
    if (onStep) await onStep(step);
    if (done || step > 60) break;
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await frames(page);
}

/** /demande : saisit une adresse dans la liste de suggestions et choisit la première. */
export async function chooseAddress(page: Page, label: string, query: string) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("option").first().click();
}
