import { expect, test, type Page } from "@playwright/test";
import { DEV_NOISE, PAGES, chooseAddress, frames, idle, scrollThrough, setReferenceViewport, statusOf } from "./helpers";

/**
 * Recette « immersion » de la refonte (docs/09, G.1 et G.3) : structure des pages (un seul h1,
 * une heure du ciel par section, plaques PK masquées), aucune erreur de console, aucun
 * débordement horizontal, aucune case à cocher hors formulaires, aucune action dans un
 * `[data-reveal]`, GSAP absent des pages calmes, niveau « off » sans mouvement (A3), et les
 * textes uniques protégés de /demande. Projets « mobile » (390 × 844) et « desktop » (1 440 × 900).
 */

/** Pages qui ne chargent jamais GSAP (G.2). */
const NO_GSAP = ["/contact", "/demande", "/panne-autoroute", "/mentions-legales", "/confidentialite", "/conditions-d-intervention", "/route-inconnue"];

test.beforeEach(async ({ page }, testInfo) => setReferenceViewport(page, testInfo));

/** Largeur qui dépasse de l'écran (0 si aucun débordement horizontal). */
async function overflowX(page: Page): Promise<number> {
  return page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
}

// ─── Structure, console, débordement : chaque page ─────────────────────────────

for (const path of PAGES) {
  test(`${path} : structure, console et débordement`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (DEV_NOISE.test(text)) return;
      // La page « Route barrée » répond 404 par nature : seule cette réponse est attendue.
      if (statusOf(path) === 404 && /status of 404/.test(text) && message.location().url.endsWith(path)) return;
      errors.push(text.slice(0, 300));
    });
    page.on("pageerror", (error) => {
      if (!DEV_NOISE.test(error.message)) errors.push(`exception : ${error.message.slice(0, 300)}`);
    });

    // Toutes les requêtes (y compris celles encore en cours à la fin) : les entrées de
    // `performance` n'apparaissent qu'une fois la réponse reçue.
    const gsapRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/_next\/.*gsap/i.test(request.url())) gsapRequests.push(request.url());
    });

    const response = await page.goto(path);
    expect(response?.status(), path).toBe(statusOf(path));
    await idle(page);

    // A1 : un seul titre de niveau 1 dans tout le document (pied de page, aube et menu compris).
    await expect.soft(page.locator("h1"), "un seul h1").toHaveCount(1);

    const structure = await page.evaluate(() => {
      const main = document.querySelector("#contenu");
      const sections = main ? Array.from(main.querySelectorAll("section")) : [];
      const topSections = sections.filter((s) => !s.parentElement?.closest("section"));
      const describe = (el: Element) => (el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
      // Texte « PK 0X » lisible par un lecteur d'écran (il doit être aria-hidden).
      const pk: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, [aria-hidden="true"]')) continue;
        if (/\bPK\s*\d/.test(node.textContent ?? "")) pk.push(`${describe(parent)} « ${(node.textContent ?? "").trim().slice(0, 30)} »`);
      }
      return {
        hasSky: main?.querySelector("[data-sky]") !== null,
        sectionsWithoutSky: sections.filter((s) => !s.hasAttribute("data-sky")).map(describe),
        // A1 : chaque section a son titre (h1 ou h2) ou, à défaut, un nom accessible.
        sectionsWithoutTitle: topSections
          .filter((s) => !s.querySelector("h1, h2") && !s.hasAttribute("aria-label") && !s.hasAttribute("aria-labelledby"))
          .map(describe),
        pk,
        // G.1 : aucune case à cocher hors des formulaires (en-tête, pied de page, menu, barre…).
        strayCheckboxes: Array.from(document.querySelectorAll('input[type="checkbox"]'))
          .filter((input) => !input.closest('form, [data-page="demande"]'))
          .map((input) => input.outerHTML.slice(0, 100)),
        shellCheckboxes: document.querySelectorAll(
          'header input[type="checkbox"], footer input[type="checkbox"], nav input[type="checkbox"]',
        ).length,
        // U2 : aucune action dans un [data-reveal], aucune action qui porte data-reveal.
        revealActions: Array.from(document.querySelectorAll("[data-reveal]"))
          .flatMap((el) => [el, ...Array.from(el.querySelectorAll("a, button"))])
          .filter((el) => el.matches("a, button"))
          .map((el) => el.outerHTML.slice(0, 100)),
      };
    });
    expect.soft(structure.hasSky, "au moins une section avec son heure du ciel").toBe(true);
    expect.soft(structure.sectionsWithoutSky, "sections sans data-sky").toEqual([]);
    expect.soft(structure.sectionsWithoutTitle, "sections sans titre de niveau 2").toEqual([]);
    expect.soft(structure.pk, "« PK 0X » lisible par les lecteurs d'écran").toEqual([]);
    expect.soft(structure.strayCheckboxes, "cases à cocher hors formulaire").toEqual([]);
    expect.soft(structure.shellCheckboxes, "cases à cocher dans la coque").toBe(0);
    expect.soft(structure.revealActions, "actions dans un [data-reveal]").toEqual([]);

    // Débordement horizontal : en haut, à chaque écran, puis à la fin.
    const overflows = new Set<string>();
    expect.soft(await overflowX(page), "débordement horizontal au chargement").toBeLessThanOrEqual(0);
    await scrollThrough(page, async (step) => {
      const extra = await overflowX(page);
      if (extra > 0) overflows.add(`écran ${step + 1} : ${extra} px`);
    });
    expect.soft([...overflows], "débordement horizontal").toEqual([]);

    // Aucun morceau GSAP sur les pages calmes, même après tout le défilement.
    if (NO_GSAP.includes(path)) {
      await idle(page);
      expect.soft(gsapRequests, "morceaux GSAP demandés").toEqual([]);
    }

    expect.soft(errors, "erreurs de console").toEqual([]);
  });
}

// ─── A3 : niveau « off » (préférence système) ──────────────────────────────────

/** Animations interdites en niveau off, mesurées dans la page. */
async function offViolations(page: Page) {
  return page.evaluate(() => {
    const describe = (animation: Animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target;
      const where = target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}.${String(target.className).slice(0, 30)}` : "?";
      const name = (animation as CSSAnimation).animationName ?? animation.id ?? "animation";
      return `${name} sur ${where}${effect?.pseudoElement ?? ""}`;
    };
    const animations = document.getAnimations();
    const infinite = animations
      .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity)
      .map(describe);
    // Seule exception : le fondu « il reste des liens » du menu mobile, un indicateur d'état du
    // défilement de la liste (masque), qui ne déplace rien.
    const scrollLinked = animations
      .filter((a) => a.timeline && !(a.timeline instanceof DocumentTimeline))
      .filter((a) => !/menu-fade$/.test((a as CSSAnimation).animationName ?? ""))
      .map(describe);
    const explicit: string[] = [];
    for (const selector of ["[data-beam]", "[data-parallax]", "[data-tilt-cam]", "[data-ground]"]) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        const name = getComputedStyle(el).animationName;
        if (name !== "none") explicit.push(`${selector} : ${name}`);
      }
    }
    for (const el of Array.from(document.querySelectorAll("[data-retro]"))) {
      const name = getComputedStyle(el, "::after").animationName;
      if (name !== "none") explicit.push(`[data-retro]::after : ${name}`);
    }
    return { infinite, scrollLinked, explicit };
  });
}

test.describe("A3 · moins d'animations (préférence système)", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const path of PAGES) {
    test(`A3 ${path} : états finaux, rien ne bouge`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
      await idle(page);
      await scrollThrough(page);
      // Au plus 1 s après le chargement, plus aucune animation infinie ni liée au défilement.
      await expect
        .poll(() => offViolations(page), { message: `${path} en niveau off`, timeout: 3000 })
        .toEqual({ infinite: [], scrollLinked: [], explicit: [] });
    });
  }

  test("A3 : aucune animation de transition de page en niveau off", async ({ page }) => {
    await page.addInitScript(`(() => {
      window.__vtAnimations = [];
      const original = Document.prototype.startViewTransition;
      if (!original) return;
      Document.prototype.startViewTransition = function (...args) {
        const transition = original.apply(this, args);
        transition.ready.then(() => {
          for (const a of document.getAnimations()) {
            const effect = a.effect;
            if (!effect || !String(effect.pseudoElement || "").startsWith("::view-transition")) continue;
            const duration = Number(effect.getComputedTiming().duration) || 0;
            if (duration > 0) window.__vtAnimations.push(effect.pseudoElement + " " + (a.animationName || "") + " " + duration + " ms");
          }
        }, () => {});
        return transition;
      };
    })();`);
    await page.goto("/");
    await idle(page);
    for (const target of ["/depannage", "/remorquage", "/contact"]) {
      await page.evaluate((href) => document.querySelector<HTMLAnchorElement>(`footer a[href="${href}"]`)?.click(), target);
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      await frames(page);
    }
    expect(await page.evaluate("window.__vtAnimations")).toEqual([]);
  });
});

test("A3 : le bouton « Arrêter les animations » coupe tout et reste mémorisé", async ({ page }) => {
  await page.goto("/depannage");
  await idle(page);
  const toggle = page.locator("footer").getByRole("button", { name: "Arrêter les animations" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect.poll(() => offViolations(page), { timeout: 3000 }).toEqual({ infinite: [], scrollLinked: [], explicit: [] });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("footer").getByRole("button", { name: "Arrêter les animations" })).toHaveAttribute("aria-pressed", "true");

  // Et on peut relancer les animations.
  await page.locator("footer").getByRole("button", { name: "Arrêter les animations" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "off");
});

// ─── G.1 : textes uniques protégés ─────────────────────────────────────────────

test("G.1 /contact : « À COMPLÉTER » visible tant que le numéro manque", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByText("À COMPLÉTER").first()).toBeVisible();
});

test("G.1 /demande : textes uniques à chaque étape", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/demande");
  await expect(page.getByRole("combobox", { name: "Adresse où se trouve le véhicule" })).toHaveCount(1);
  await chooseAddress(page, "Adresse où se trouve le véhicule", "12 rue Hoche, Pantin");
  await expect(page.getByRole("button", { name: "Non", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Non", exact: true }).click();
  await expect(page.getByRole("button", { name: /Continuer/ })).toHaveCount(1);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("combobox", { name: "Destination du véhicule" })).toHaveCount(1);
  await chooseAddress(page, "Destination du véhicule", "Paris 11e");
  await expect(page.getByRole("button", { name: /Continuer/ })).toHaveCount(1);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("button", { name: /Berline/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Berline/ }).click();
  await expect(page.getByRole("button", { name: /Panne mécanique/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Panne mécanique/ }).click();
  await expect(page.getByRole("button", { name: "Non", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Non", exact: true }).click();
  await expect(page.getByRole("button", { name: /Voir le prix/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Voir le prix/ }).click();

  // Étape prix : « prix estimé » (toutes casses) dans un seul élément de tout le document.
  await expect(page.getByText(/prix estimé/i)).toHaveCount(1);
  await expect(page.getByText(/prix estimé/i)).toBeVisible();
  await expect(page.getByText(/\d+\s?€/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Demander le dépannage/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Demander le dépannage/ }).click();

  await expect(page.getByPlaceholder("Votre nom")).toHaveCount(1);
  await expect(page.getByPlaceholder("06 12 34 56 78")).toHaveCount(1);
  await page.getByPlaceholder("Votre nom").fill("Recette Immersion");
  await page.getByPlaceholder("06 12 34 56 78").fill("06 12 34 56 78");
  // La dernière case de la page est le consentement, et toutes les cases sont dans le parcours.
  const consent = page.locator("input[type=checkbox]").last();
  await expect(consent.locator("xpath=ancestor::label[1]")).toContainText("J'accepte que RNB AUTO utilise ces informations");
  const stray = await page.evaluate(
    () => Array.from(document.querySelectorAll('input[type="checkbox"]')).filter((input) => !input.closest('form, [data-page="demande"]')).length,
  );
  expect(stray, "cases à cocher hors du parcours").toBe(0);
  await consent.check();
  await page.waitForTimeout(2600); // temps minimal de remplissage (protection contre les robots, règle du serveur)
  await expect(page.getByRole("button", { name: /Envoyer ma demande/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();

  await expect(page.getByText("Demande reçue")).toHaveCount(1);
  await expect(page.getByText("Demande reçue")).toBeVisible();
  await expect(page.getByText(/RNB-\d{4}-\d{5}/)).toHaveCount(1);
  await expect(page.getByText(/RNB-\d{4}-\d{5}/)).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
});
