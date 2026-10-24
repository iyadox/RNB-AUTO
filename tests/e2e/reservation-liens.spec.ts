import { expect, test, type APIRequestContext } from "@playwright/test";
import { PAGES } from "./helpers";

/**
 * Tous les liens du site public : on part de chaque page, on suit chaque lien interne (pages
 * découvertes comprises), et on vérifie :
 * - chaque page interne répond 200 (sauf l'adresse inconnue : 404, et /admin : redirection) ;
 * - chaque ancre (#id, sur la page ou sur une autre) existe dans le HTML rendu par le serveur ;
 * - tel:, mailto: et wa.me sont bien formés ;
 * - chaque bouton d'action mène au bon endroit (Appeler → tel: ou /contact, WhatsApp → wa.me,
 *   Demander → /demande, Contact → /contact). Sans numéro réglé, Appeler et WhatsApp de la barre
 *   d'action mènent à /contact, qui affiche « À COMPLÉTER ».
 * Le site est lancé avec une base vide : sans numéro réglé, Appeler mène à /contact.
 */

type Found = { from: string; href: string; text: string };

const START = [...PAGES, "/suivi/RNB-2026-00001?t=jeton-de-recette-non-valable"];

async function fetchPage(request: APIRequestContext, cache: Map<string, { status: number; html: string }>, path: string) {
  const cached = cache.get(path);
  if (cached) return cached;
  const response = await request.get(path, { maxRedirects: 0 });
  const entry = { status: response.status(), html: await response.text() };
  cache.set(path, entry);
  return entry;
}

const hasId = (html: string, id: string) => html.includes(`id="${id}"`);

test("tous les liens des pages publiques mènent quelque part", async ({ page, request }) => {
  test.setTimeout(300_000);
  const queue = [...START];
  const seen = new Set<string>();
  const links: Found[] = [];
  while (queue.length > 0) {
    const path = queue.shift() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const found = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => ({
        href: a.getAttribute("href") ?? "",
        text: (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim(),
      })),
    );
    for (const link of found) {
      links.push({ from: path, ...link });
      if (link.href.startsWith("/") && !link.href.startsWith("//")) {
        const target = link.href.split("#")[0];
        if (target && !target.startsWith("/admin") && !target.startsWith("/api") && !seen.has(target)) queue.push(target);
      }
    }
  }
  expect(seen.size, "pages parcourues").toBeGreaterThanOrEqual(START.length);

  const cache = new Map<string, { status: number; html: string }>();
  const problems: string[] = [];
  const unique = new Map(links.map((link) => [`${link.from}|${link.href}|${link.text}`, link]));
  for (const { from, href, text } of unique.values()) {
    const where = `${from} → ${href} (« ${text.slice(0, 50)} »)`;
    if (href.startsWith("tel:")) {
      if (!/^tel:\+?\d{3,15}$/.test(href)) problems.push(`tel: mal formé : ${where}`);
    } else if (href.startsWith("mailto:")) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(href)) problems.push(`mailto: mal formé : ${where}`);
    } else if (href.startsWith("https://wa.me/")) {
      if (!/^https:\/\/wa\.me\/\d{8,15}(\?text=.+)?$/.test(href)) problems.push(`WhatsApp mal formé : ${where}`);
    } else if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1));
      if (!id || !hasId((await fetchPage(request, cache, from)).html, id)) problems.push(`ancre absente : ${where}`);
    } else if (href.startsWith("/")) {
      const [path, hash] = href.split("#") as [string, string | undefined];
      const target = await fetchPage(request, cache, path || from);
      const expected = path === "/route-inconnue" ? 404 : path.startsWith("/admin") ? null : 200;
      if (expected === null) {
        if (![200, 307, 308].includes(target.status)) problems.push(`espace de gestion injoignable (${target.status}) : ${where}`);
      } else if (target.status !== expected) {
        problems.push(`page en erreur (${target.status}) : ${where}`);
      }
      if (hash && !hasId(target.html, decodeURIComponent(hash))) problems.push(`ancre absente : ${where}`);
    } else if (!/^https:\/\//.test(href)) {
      problems.push(`lien inconnu : ${where}`);
    }

    // Chaque bouton d'action mène au bon endroit.
    const label = text.toLowerCase();
    if (/^appeler(?! le 112)/.test(label) && !(href.startsWith("tel:") || href === "/contact")) problems.push(`« Appeler » ne mène pas à un appel : ${where}`);
    if (label === "appeler le 112" && href !== "tel:112") problems.push(`« Appeler le 112 » : ${where}`);
    // Sans numéro réglé, la barre d'action mène à /contact (marqueur « À COMPLÉTER »), jamais à un faux numéro.
    if (/^(écrire sur )?whatsapp$/.test(label) && !(href.startsWith("https://wa.me/") || href === "/contact")) problems.push(`« WhatsApp » ne mène pas à WhatsApp : ${where}`);
    if (/^demander (un dépannage|le relais)/.test(label) && !href.startsWith("/demande")) problems.push(`« Demander » ne mène pas à /demande : ${where}`);
    if (label === "contact" && href !== "/contact") problems.push(`« Contact » : ${where}`);
  }
  expect(problems, problems.join("\n")).toEqual([]);
});

test("sitemap et robots : toutes les pages publiques, rien de privé", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of PAGES.filter((p) => p !== "/route-inconnue")) {
    expect(sitemap, `sitemap : ${path}`).toContain(`${path === "/" ? "" : path}</loc>`);
  }
  for (const path of ["/admin", "/api/", "/suivi/", "/route-inconnue"]) expect(sitemap).not.toContain(path);
  // Chaque adresse du plan du site répond 200.
  for (const loc of sitemap.match(/<loc>[^<]+<\/loc>/g) ?? []) {
    const path = new URL(loc.slice(5, -6)).pathname;
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const robots = await (await request.get("/robots.txt")).text();
  for (const rule of ["Disallow: /admin", "Disallow: /api/", "Disallow: /suivi/"]) expect(robots).toContain(rule);
  expect(robots).toMatch(/Sitemap: .+\/sitemap\.xml/);
});
