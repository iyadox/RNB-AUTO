import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * Recette « urgence » de la refonte immersive (docs/09, G.1 : U1 à U4, U6, U8, U10).
 * Une personne en panne doit toujours pouvoir appeler, écrire ou demander, quoi que fassent les
 * animations. Projets : « mobile » (390 × 844, écran tactile) et « desktop » (1 440 × 900).
 * Aucune temporisation arbitraire : on attend un état (expect.poll, événements du navigateur).
 */

/** Toutes les pages publiques (la dernière est la page « Route barrée » d'une adresse inconnue). */
const PAGES = [
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

const statusOf = (path: string) => (path === "/route-inconnue" ? 404 : 200);
const isMobile = (testInfo: TestInfo) => testInfo.project.name !== "desktop";

/** Pages dont l'ouverture a un bouton principal jaune (U4). /panne-autoroute : les réflexes d'abord. */
const OPENING_BUTTON = ["/", "/depannage", "/remorquage", "/zones-d-intervention", "/questions-frequentes", "/entreprise", "/route-inconnue"];

/** Morceaux chargés en différé : GSAP (et son chargeur) et Lenis. */
const DEFERRED_CHUNK = /\/_next\/.*(gsap|lenis)/i;

/**
 * Bruit du serveur de développement (Turbopack) : course au chargement d'une feuille CSS pendant
 * la compilation à la demande. N'existe pas dans un build de production (relevé par L1a et L6b).
 */
const DEV_NOISE = /No link element found for chunk/;

test.beforeEach(async ({ page }, testInfo) => {
  // Largeur de référence du cahier pour le téléphone.
  if (isMobile(testInfo)) await page.setViewportSize({ width: 390, height: 844 });
});

// ─── Outils ─────────────────────────────────────────────────────────────────────

async function frames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** Attend le premier moment calme du navigateur (le runtime y lance son chargement différé). */
async function idle(page: Page) {
  await page.evaluate(
    () => new Promise<void>((resolve) => (window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 2000 }) : resolve())),
  );
}

/** Parcourt la page de haut en bas (80 % d'écran par pas) puis revient en haut. */
async function scrollThrough(page: Page, onStep?: (step: number) => Promise<void>) {
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

/**
 * Textes cachés dans la zone visible : opacité effective (produit des ancêtres) sous 0,05 ou
 * `visibility: hidden`. Le décor `aria-hidden`, les textes `sr-only` et les questions fermées
 * ne comptent pas. Une atténuation volontaire (freinage de l'accueil, 0,15) n'est pas « cachée ».
 */
async function hiddenTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const out: string[] = [];
    const roots = [document.querySelector("#contenu"), document.querySelector("footer")].filter((el): el is Element => el !== null);
    for (const root of roots) {
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,li,dt,dd,a,button,label,figcaption,blockquote"))) {
        if (!el.checkVisibility()) continue;
        if (el.closest('[aria-hidden="true"], .sr-only, [inert]')) continue;
        const ownText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 1);
        if (!ownText) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2 || rect.bottom < vh * 0.1 || rect.top > vh * 0.9) continue;
        let opacity = 1;
        for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
        const invisible = getComputedStyle(el).visibility === "hidden";
        if (opacity < 0.05 || invisible) {
          out.push(`${el.tagName.toLowerCase()} « ${(el.textContent ?? "").trim().slice(0, 50)} » (opacité ${opacity.toFixed(2)}${invisible ? ", visibility: hidden" : ""})`);
        }
      }
    }
    return out;
  });
}

/**
 * Liens d'urgence qui ne reçoivent pas le toucher à leur centre (U6). Téléphone : les liens de
 * la barre d'action. Ordinateur (la barre n'existe pas à partir de 768 px) : les liens de la
 * bande de l'en-tête (Appeler, Demander un dépannage, navigation).
 */
async function actionMisses(page: Page, mobile: boolean): Promise<{ targets: number; misses: string[] }> {
  return page.evaluate((onPhone) => {
    const header = document.querySelector("header");
    const band = header ? header.getBoundingClientRect().bottom + 1 : 0;
    const candidates = onPhone
      ? Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Actions rapides"] a'))
      : Array.from(document.querySelectorAll<HTMLElement>("header a")).filter((a) => a.getBoundingClientRect().bottom <= band);
    const misses: string[] = [];
    let targets = 0;
    for (const el of candidates) {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      targets += 1;
      const label = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30) || el.getAttribute("aria-label") || "lien";
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
        misses.push(`« ${label} » hors de l'écran`);
        continue;
      }
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === el || el.contains(hit))) {
        const what = hit ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ""}.${String(hit.className).slice(0, 40)}` : "rien";
        misses.push(`« ${label} » recouvert par ${what}`);
      }
    }
    return { targets, misses };
  }, mobile);
}

// ─── U1 : la barre d'action existe sans JavaScript ─────────────────────────────

test.describe("U1 · sans JavaScript, on peut appeler, écrire et demander", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of PAGES) {
    test(`U1 ${path}`, async ({ page }, testInfo) => {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(statusOf(path));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();

      // Sélecteur CSS (et non le rôle) : sur ordinateur, la barre existe dans le HTML mais est masquée.
      const bar = page.locator('nav[aria-label="Actions rapides"]');
      const call = bar.locator("a[data-action=call]");
      const whatsapp = bar.locator("a[data-action=whatsapp]");
      const request = bar.locator("a[data-action=request]");
      await expect(call).toHaveCount(1);
      await expect(whatsapp).toHaveCount(1);
      await expect(request).toHaveCount(1);

      // Appeler : `tel:`, ou /contact avec « N° à compléter » (jamais de numéro inventé).
      const callHref = (await call.getAttribute("href")) ?? "";
      expect(callHref.startsWith("tel:") || callHref === "/contact", `Appeler → ${callHref}`).toBe(true);
      if (callHref === "/contact") await expect(call).toContainText("N° à compléter");
      const waHref = (await whatsapp.getAttribute("href")) ?? "";
      expect(waHref.startsWith("https://wa.me/") || waHref === "/contact", `WhatsApp → ${waHref}`).toBe(true);
      await expect(request).toHaveAttribute("href", "/demande");

      if (isMobile(testInfo)) {
        await expect(call).toBeVisible();
        await expect(whatsapp).toBeVisible();
        if (path === "/demande") await expect(request).toBeHidden();
        else await expect(request).toBeVisible();
      } else {
        // Ordinateur : pas de barre ; l'en-tête garde « Demander un dépannage » (sauf sur /demande)
        // et la navigation mène au contact.
        const header = page.locator("header");
        await expect(header.getByRole("link", { name: "Contact", exact: true })).toBeVisible();
        // Le premier lien : le bouton de l'en-tête (le menu replié, plus loin, en contient un autre).
        const primary = header.locator('a[href="/demande"]').first();
        if (path === "/demande") await expect(primary).toBeHidden();
        else await expect(primary).toBeVisible();
      }
    });
  }
});

// ─── U2 : aucune action n'apparaît, ne s'estompe ni n'attend ───────────────────

for (const path of PAGES) {
  test(`U2 ${path} : aucune action animée ni cachée`, async ({ page }) => {
    await page.goto(path);
    await idle(page);

    const inReveal = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"], a[href="/demande"], a[href^="/demande?"], button'))
        .filter((el) => el.closest("[data-reveal]"))
        .map((el) => el.outerHTML.slice(0, 120)),
    );
    expect(inReveal, "actions dans un [data-reveal]").toEqual([]);

    // À chaque écran : les actions visibles sont à opacité 1 et sans animation d'entrée.
    const problems = new Set<string>();
    await scrollThrough(page, async () => {
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const motionProps = /opacity|transform|translate|scale|rotate|clip-path|filter/;
        for (const el of Array.from(
          document.querySelectorAll<HTMLElement>(
            '#contenu :is(a[href^="tel:"], a[href*="wa.me"], a[href="/demande"], a[href^="/demande?"], button), footer :is(a[href^="tel:"], a[href*="wa.me"], a[href="/demande"], button)',
          ),
        )) {
          if (!el.checkVisibility({ visibilityProperty: true })) continue;
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight || rect.width === 0) continue;
          const label = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
          let opacity = 1;
          for (let node: Element | null = el; node; node = node.parentElement) {
            opacity *= Number(getComputedStyle(node).opacity);
            for (const animation of node.getAnimations()) {
              const effect = animation.effect as KeyframeEffect | null;
              if (!effect || effect.pseudoElement) continue;
              if (effect.getComputedTiming().iterations === Infinity) continue;
              const keys = effect.getKeyframes().flatMap((frame) => Object.keys(frame));
              const touched = keys.filter((key) => motionProps.test(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)));
              if (touched.length > 0 && animation.playState === "running") {
                const name = (animation as CSSAnimation).animationName ?? animation.id ?? "animation";
                out.push(`« ${label} » : ${name} (${touched.join(", ")}) sur ${node.tagName.toLowerCase()}`);
              }
            }
          }
          // Un bouton peut être atténué par son état (désactivé, choix non retenu) : pour les
          // boutons, seule l'animation d'entrée est refusée ; les liens d'action, eux, sont à 1.
          if (opacity < 0.99 && el.tagName === "A") out.push(`« ${label} » à opacité ${opacity.toFixed(2)}`);
        }
        return out;
      });
      found.forEach((item) => problems.add(item));
    });
    expect([...problems], "actions estompées ou animées").toEqual([]);
  });
}

// ─── U3 : titre, accroche et bouton principal immobiles dès DOMContentLoaded ────

/** Mesure exécutée dans la page : titre principal, accroche, bouton principal de l'ouverture. */
const MEASURE_OPENING = `(() => {
  const h1 = document.querySelector("h1");
  if (!h1) return { missing: "h1" };
  const scope = h1.closest("section") || document.querySelector("#contenu") || document.body;
  const after = (el) => (h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  const lead = Array.from(scope.querySelectorAll("p")).find(
    (p) => after(p) && !p.closest('[aria-hidden="true"], .sr-only, a, button') && (p.textContent || "").trim().length >= 20,
  );
  const primary = scope.querySelector("a.bg-signal-500");
  const state = (el) => {
    if (!el) return null;
    let opacity = 1;
    for (let node = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    const style = getComputedStyle(el);
    return {
      text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40),
      opacity: Math.round(opacity * 1000) / 1000,
      transform: style.transform,
      translate: style.translate,
      visibility: style.visibility,
    };
  };
  return { h1: state(h1), lead: state(lead), primary: state(primary) };
})()`;

type OpeningState = { text: string; opacity: number; transform: string; translate: string; visibility: string } | null;

function expectStill(label: string, state: OpeningState, moment: string) {
  if (!state) return;
  expect.soft(state.opacity, `${label} « ${state.text} » : opacité (${moment})`).toBe(1);
  expect.soft(state.transform, `${label} « ${state.text} » : transform (${moment})`).toBe("none");
  expect.soft(["none", "0px"], `${label} « ${state.text} » : translate (${moment})`).toContain(state.translate);
  expect.soft(state.visibility, `${label} « ${state.text} » : visibility (${moment})`).toBe("visible");
}

for (const path of PAGES) {
  test(`U3 ${path} : ouverture visible et immobile`, async ({ page }) => {
    await page.addInitScript(`document.addEventListener("DOMContentLoaded", () => { window.__u3 = ${MEASURE_OPENING}; }, { once: true });`);
    await page.goto(path);
    const atDcl = (await page.evaluate("window.__u3")) as Record<string, OpeningState> & { missing?: string };
    expect(atDcl.missing, "titre principal").toBeUndefined();
    expect(atDcl.h1, "titre principal").not.toBeNull();
    // Rien n'est contrôlé « par défaut » : l'accroche existe partout, le bouton principal sur les
    // pages qui en ont un dans leur ouverture (même liste que U4).
    expect(atDcl.lead, "accroche de l'ouverture").not.toBeNull();
    if (OPENING_BUTTON.includes(path)) expect(atDcl.primary, "bouton principal de l'ouverture").not.toBeNull();
    for (const key of ["h1", "lead", "primary"] as const) expectStill(key, atDcl[key] ?? null, "DOMContentLoaded");

    // Après le démarrage du runtime (états cachés posés) : toujours rien de caché ni de déplacé.
    await idle(page);
    await frames(page);
    const later = (await page.evaluate(MEASURE_OPENING)) as Record<string, OpeningState>;
    for (const key of ["h1", "lead", "primary"] as const) expectStill(key, later[key] ?? null, "après le démarrage des animations");
  });
}

// ─── U4 : premier écran d'un petit téléphone, sans JavaScript ──────────────────

test.describe("U4 · 390 × 664 sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of PAGES) {
    test(`U4 ${path}`, async ({ page }, testInfo) => {
      test.skip(!isMobile(testInfo), "Règle du téléphone");
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(path);

      if (OPENING_BUTTON.includes(path)) {
        const primary = page.locator("h1").locator("xpath=ancestor::section[1]").locator("a.bg-signal-500").first();
        await expect(primary, "bouton principal de l'ouverture").toBeVisible();
        const box = await primary.boundingBox();
        const limit = path === "/" ? 600 : 580;
        expect(box && box.y + box.height, `bas du bouton principal (limite ${limit} px)`).toBeLessThan(limit);
      }
      if (path === "/panne-autoroute") {
        const reflex = page.locator("#ouverture ol > li").first();
        const box = await reflex.boundingBox();
        expect(box?.y, "début du premier réflexe").toBeLessThan(664);
      }

      // La barre d'action est visible (Appeler et WhatsApp au moins) et entière dans le premier écran.
      const bar = page.locator('nav[aria-label="Actions rapides"]');
      await expect(bar.locator("a[data-action=call]")).toBeVisible();
      await expect(bar.locator("a[data-action=whatsapp]")).toBeVisible();
      for (const link of await page.locator('nav[aria-label="Actions rapides"] a').all()) {
        if (!(await link.isVisible())) continue;
        const box = await link.boundingBox();
        expect(box && box.y + box.height, "barre d'action dans le premier écran").toBeLessThanOrEqual(664);
      }
    });
  }
});

// ─── U6 : la barre d'action reste au-dessus de tout ────────────────────────────

for (const path of PAGES) {
  test(`U6 ${path} : actions jamais recouvertes (5 positions)`, async ({ page }, testInfo) => {
    const mobile = isMobile(testInfo);
    await page.goto(path);
    await idle(page);
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: Math.round(max * f), behavior: "instant" });
      }, fraction);
      await frames(page);
      // Mesure immédiate (deux images après le défilement), sans attendre que « ça s'arrange » :
      // une action recouverte, même un instant, est un défaut.
      const { misses, targets } = await actionMisses(page, mobile);
      expect(misses, `${path} à ${fraction * 100} % du défilement`).toEqual([]);
      expect(targets, "liens contrôlés").toBeGreaterThanOrEqual(2);
    }
  });
}

test("U6 pendant une transition de page : les actions restent touchables", async ({ page }, testInfo) => {
  const mobile = isMobile(testInfo);
  // Chaque transition (ViewTransition) est mesurée au début de l'animation (`ready`, après la
  // phase de mise à jour pendant laquelle le navigateur suspend le rendu), 100 ms plus tard et à la fin.
  await page.addInitScript(`(() => {
    window.__vt = { started: 0, checks: [] };
    const original = Document.prototype.startViewTransition;
    if (!original) return;
    Document.prototype.startViewTransition = function (...args) {
      const transition = original.apply(this, args);
      window.__vt.started += 1;
      const check = (moment) => window.__vt.checks.push({ moment, misses: window.__actionMisses ? window.__actionMisses() : ["mesure absente"] });
      transition.ready.then(() => { check("ready"); setTimeout(() => check("ready + 100 ms"), 100); }, () => {});
      transition.finished.then(() => check("fin"), () => {});
      return transition;
    };
  })();`);
  await page.goto("/");
  await page.evaluate((onPhone) => {
    (window as unknown as { __actionMisses: () => string[] }).__actionMisses = () => {
      const header = document.querySelector("header");
      const band = header ? header.getBoundingClientRect().bottom + 1 : 0;
      const candidates = onPhone
        ? Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Actions rapides"] a'))
        : Array.from(document.querySelectorAll<HTMLElement>("header a")).filter((a) => a.getBoundingClientRect().bottom <= band);
      const misses: string[] = [];
      for (const el of candidates) {
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (!hit || !(hit === el || el.contains(hit))) misses.push(`${(el.textContent ?? "").trim().slice(0, 30)} → ${hit ? hit.tagName.toLowerCase() : "rien"}`);
      }
      return misses;
    };
  }, mobile);
  await idle(page);

  for (const target of ["/depannage", "/remorquage", "/contact", "/questions-frequentes"]) {
    const before = (await page.evaluate("window.__vt.checks.length")) as number;
    const started = (await page.evaluate("window.__vt.started")) as number;
    await page.evaluate((href) => {
      const link = document.querySelector<HTMLAnchorElement>(`footer a[href="${href}"]`);
      if (!link) throw new Error(`lien ${href} absent du pied de page`);
      link.click();
    }, target);
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator("h1")).toHaveCount(1);
    const transitioned = ((await page.evaluate("window.__vt.started")) as number) > started;
    if (transitioned) {
      await expect.poll(async () => ((await page.evaluate("window.__vt.checks.length")) as number) - before, { timeout: 5000 }).toBeGreaterThanOrEqual(3);
      const checks = (await page.evaluate(`window.__vt.checks.slice(${before})`)) as { moment: string; misses: string[] }[];
      for (const check of checks) expect.soft(check.misses, `vers ${target}, ${check.moment}`).toEqual([]);
    }
    // Juste après la navigation (avec ou sans transition).
    await expect.poll(async () => (await actionMisses(page, mobile)).misses, { message: `après la navigation vers ${target}` }).toEqual([]);
  }
  expect((await page.evaluate("window.__vt.started")) as number, "au moins une transition de page jouée").toBeGreaterThan(0);
});

// ─── U8 : /demande, aucune attente artificielle ────────────────────────────────

async function chooseAddress(page: Page, label: string, query: string) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("option").first().click();
}

test("U8 /demande : calcul lent, message à 4 s, prix immédiat", async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await page.goto("/demande");
  await chooseAddress(page, "Adresse où se trouve le véhicule", "12 rue Hoche, Pantin");
  await page.getByRole("button", { name: "Non", exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await chooseAddress(page, "Destination du véhicule", "Paris 11e");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: /Berline/ }).click();
  await page.getByRole("button", { name: /Panne mécanique/ }).click();
  await page.getByRole("button", { name: "Non", exact: true }).click();

  // Le serveur répond lentement à l'estimation (7 s) : on voit ce que voit le client.
  let delayed = 0;
  await page.route("**/demande**", async (route) => {
    const request = route.request();
    if (request.method() === "POST" && request.headers()["next-action"] && delayed === 0) {
      delayed += 1;
      await new Promise((resolve) => setTimeout(resolve, 7000));
    }
    await route.fallback();
  });

  const started = Date.now();
  await page.getByRole("button", { name: /Voir le prix/ }).click();
  // Pas d'attente artificielle : l'écran de calcul s'affiche tout de suite.
  await expect(page.getByRole("heading", { name: /Calcul en cours/ })).toBeVisible({ timeout: 2000 });
  const slowMessage = page.getByText("Toujours en cours… Vous pouvez aussi nous appeler.");
  await expect(slowMessage).toBeHidden();

  // Appeler et WhatsApp restent visibles et touchables pendant le calcul.
  if (isMobile(testInfo)) {
    const bar = page.getByRole("navigation", { name: "Actions rapides" });
    await expect(bar.locator("a[data-action=call]")).toBeVisible();
    await expect(bar.locator("a[data-action=whatsapp]")).toBeVisible();
    expect((await actionMisses(page, true)).misses).toEqual([]);
  } else {
    await expect(page.locator("header").getByRole("link", { name: "Contact", exact: true })).toBeVisible();
    expect((await actionMisses(page, false)).misses).toEqual([]);
  }

  // Message au bout de 4 s.
  await expect(slowMessage).toBeVisible({ timeout: 10_000 });
  const elapsed = Date.now() - started;
  expect(elapsed, "délai avant le message").toBeGreaterThanOrEqual(3800);
  expect(delayed, "estimation retardée").toBe(1);

  // Dès la réception : le titre, le prix dans le texte (zone aria-live) et des boutons actifs,
  // au même instant (mesuré dans la même image).
  const handle = await page.waitForFunction(
    () => {
      const title = Array.from(document.querySelectorAll("h1")).find((h) => /Votre estimation/.test(h.textContent ?? ""));
      if (!title) return null;
      const live = title.closest("[aria-live]");
      const button = Array.from(document.querySelectorAll("button")).find((b) => /Demander le dépannage/.test(b.textContent ?? ""));
      return {
        live: live?.getAttribute("aria-live") ?? null,
        price: /\d+\s?€/.test(live?.textContent ?? ""),
        buttonReady: Boolean(button && !button.disabled && getComputedStyle(button).pointerEvents !== "none"),
      };
    },
    undefined,
    { timeout: 30_000, polling: "raf" },
  );
  const received = (await handle.jsonValue()) as { live: string | null; price: boolean; buttonReady: boolean };
  expect(received.live, "zone aria-live du prix").toBe("polite");
  expect(received.price, "prix dans le texte dès la réception").toBe(true);
  expect(received.buttonReady, "« Demander le dépannage » actif tout de suite").toBe(true);
  await expect(page.getByText(/\d+\s?€/).first()).toBeVisible();
});

// ─── U10 : GSAP et Lenis toujours en différé, et facultatifs ───────────────────

for (const path of PAGES) {
  test(`U10 ${path} : rien de GSAP ni de Lenis au chargement`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: "load" });
    const atLoad = (await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name))) as string[];
    expect(atLoad.filter((url) => DEFERRED_CHUNK.test(url)), "morceaux GSAP ou Lenis au chargement").toEqual([]);
    // Pas de Lenis sur écran tactile, ni sur /demande (U5).
    if (isMobile(testInfo) || path === "/demande") {
      await idle(page);
      await scrollThrough(page);
      await expect(page.locator("html.lenis")).toHaveCount(0);
    }
  });
}

test.describe("U10 · GSAP et Lenis bloqués", () => {
  for (const path of PAGES) {
    test(`U10 ${path} : la page reste complète sans GSAP ni Lenis`, async ({ page }) => {
      const blocked: string[] = [];
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        if (!DEV_NOISE.test(error.message)) pageErrors.push(error.message);
      });
      await page.route(DEFERRED_CHUNK, async (route) => {
        blocked.push(route.request().url());
        await route.abort("blockedbyclient");
      });
      const response = await page.goto(path);
      expect(response?.status()).toBe(statusOf(path));
      await idle(page);
      await expect(page.locator("h1")).toBeVisible();

      const hidden = new Set<string>();
      await scrollThrough(page, async (step) => {
        await expect
          .poll(() => hiddenTexts(page), { message: `${path}, écran ${step + 1} : textes cachés`, timeout: 6000 })
          .toEqual([]);
        (await hiddenTexts(page)).forEach((item) => hidden.add(item));
      });
      expect([...hidden]).toEqual([]);
      expect(pageErrors, "erreurs JavaScript").toEqual([]);
    });
  }

  test("U10 contrôle : le blocage touche bien les pages qui chargent GSAP", async ({ page }) => {
    const blocked: string[] = [];
    await page.route(DEFERRED_CHUNK, async (route) => {
      blocked.push(route.request().url());
      await route.abort("blockedbyclient");
    });
    await page.goto("/depannage");
    await idle(page);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await expect.poll(() => blocked.length, { message: "requête GSAP interceptée" }).toBeGreaterThan(0);
    // Le titre et les sections restent lisibles.
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#contenu h2").first()).toBeVisible();
  });
});
