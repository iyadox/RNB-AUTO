import { expect, test, type Page } from "@playwright/test";

/**
 * Décor de l'accueil « de la commande à l'arrivée » (src/components/story) : rien dans le HTML,
 * monté au premier défilement, sous le contenu, sans pointeur ; chaque acte suit sa fenêtre ;
 * image fixe en « moins d'animations ». Projet « mobile » (390 × 844).
 */

const STAGE = "[data-story-track] [data-story-stage]";

/** Fait défiler jusqu'à une position de la fenêtre d'un acte (0 : elle entre, 1 : elle sort). */
async function scrollToAct(page: Page, act: 1 | 2 | 3, progress: number) {
  await page.evaluate(
    ([act, progress]) => {
      const el = document.querySelector(`[data-story-window="${act}"]`);
      if (!el) throw new Error("fenêtre absente");
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - window.innerHeight + progress * (window.innerHeight + rect.height);
      window.scrollTo({ top, behavior: "instant" });
    },
    [act, progress] as const,
  );
}

/** Décalage horizontal de la dépanneuse du décor (matrice de `transform`). */
const truckShift = (page: Page) =>
  page.evaluate((stage) => {
    const truck = document.querySelector(`${stage} [class*="__truck"]`);
    if (!truck) return null;
    return new DOMMatrixReadOnly(getComputedStyle(truck).transform).m41;
  }, STAGE);

test.describe("Décor « de la commande à l'arrivée »", () => {
  test("rien au chargement, monté au défilement, sous le contenu et sans pointeur", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(STAGE)).toHaveCount(1);
    await expect(page.locator(STAGE)).toHaveAttribute("aria-hidden", "true");
    // Aucun dessin tant que personne n'a fait défiler la page.
    await page.waitForTimeout(1500);
    expect(await page.locator(`${STAGE} *`).count()).toBe(0);

    await scrollToAct(page, 1, 0.5);
    await expect.poll(() => page.locator(`${STAGE} svg`).count(), { timeout: 15_000 }).toBeGreaterThan(2);
    const style = await page.locator(STAGE).evaluate((el) => {
      const s = getComputedStyle(el);
      return { pointer: s.pointerEvents, position: s.position, z: s.zIndex };
    });
    expect(style).toEqual({ pointer: "none", position: "sticky", z: "-1" });
    // Les boutons de la barre d'action restent au-dessus et actifs.
    await expect(page.getByRole("link", { name: /Appeler/ }).last()).toBeVisible();
  });

  test("la dépanneuse arrive avec la deuxième fenêtre et repart avec la troisième", async ({ page }) => {
    await page.goto("/");
    await scrollToAct(page, 1, 0.5);
    await expect.poll(() => truckShift(page), { timeout: 15_000 }).not.toBeNull();
    // Avant son acte : hors de l'écran, à gauche.
    await scrollToAct(page, 2, 0.05);
    await expect.poll(() => truckShift(page)).toBeLessThan(-200);
    // Fin de l'arrivée : à l'arrêt devant la voiture.
    await scrollToAct(page, 2, 0.8);
    await expect.poll(() => truckShift(page)).toBe(0);
    // Fin du troisième acte : repartie, hors de l'écran à droite.
    await scrollToAct(page, 3, 0.98);
    await expect.poll(() => truckShift(page)).toBeGreaterThan(200);
  });

  test.describe("moins d'animations", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("image fixe : dépanneuse arrêtée, aucune animation liée au défilement", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
      await scrollToAct(page, 2, 0.05);
      await expect.poll(() => truckShift(page), { timeout: 15_000 }).toBe(0);
      const scrollLinked = await page.locator(STAGE).evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.timeline && !(a.timeline instanceof DocumentTimeline)).length,
      );
      expect(scrollLinked).toBe(0);
    });
  });
});
