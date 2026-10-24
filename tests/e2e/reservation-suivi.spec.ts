import { expect, test, type Page } from "@playwright/test";
import { chooseAddress } from "./helpers";

/**
 * Parcours de réservation complet : demande en ligne → « Demande reçue » avec le lien de suivi →
 * page de suivi (étape, prix, Appeler, photos) → RNB AUTO accepte puis part → le suivi change
 * tout seul, sans recharger. Puis les liens faux et l'envoi de photos par le lien.
 *
 * Rangé après `parcours.spec.ts` (ordre alphabétique) : le compte de gestion existe déjà ; lancé
 * seul, ce fichier le crée par la page d'installation, avec le même compte.
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { name: "Administrateur", email: "admin@exemple.test", password: "Essai-2026-tarifs" };
const CLIENT = "Client Suivi Recette";

async function signIn(page: Page) {
  await page.goto("/admin/installation");
  if (await page.locator("input[name=confirm]").count()) {
    await page.locator("input[name=name]").fill(ADMIN.name);
    await page.locator("input[name=email]").fill(ADMIN.email);
    await page.locator("input[name=password]").fill(ADMIN.password);
    await page.locator("input[name=confirm]").fill(ADMIN.password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
  } else {
    await page.goto("/admin/connexion");
    await page.locator("input[name=email]").fill(ADMIN.email);
    await page.locator("input[name=password]").fill(ADMIN.password);
    await page.locator("button[type=submit]").click();
  }
  await expect(page).toHaveURL(/\/admin$/);
}

let trackingUrl = "";

test("demande en ligne → lien de suivi → statut visible", async ({ page }) => {
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
  await page.getByRole("button", { name: /Voir le prix/ }).click();
  await expect(page.getByText(/\d+\s?€/).first()).toBeVisible();
  await page.getByRole("button", { name: /Demander le dépannage/ }).click();
  await page.getByPlaceholder("Votre nom").fill(CLIENT);
  await page.getByPlaceholder("06 12 34 56 78").fill("06 12 34 56 78");
  await page.locator("input[type=checkbox]").last().check();
  await page.waitForTimeout(2600); // temps minimal de remplissage (protection contre les robots)
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();
  await expect(page.getByText("Demande reçue")).toBeVisible();
  const reference = (await page.getByText(/RNB-\d{4}-\d{5}/).innerText()).match(/RNB-\d{4}-\d{5}/)?.[0] as string;

  // Le lien de suivi : affiché en entier, copiable, et ouvrable.
  const open = page.getByRole("link", { name: /Ouvrir mon suivi/ });
  await expect(open).toBeVisible();
  const href = (await open.getAttribute("href")) as string;
  expect(href).toMatch(new RegExp(`^/suivi/${reference}\\?t=[A-Za-z0-9_-]{32}$`));
  await expect(page.getByRole("textbox", { name: "Lien de suivi" })).toHaveValue(new RegExp(`${href.replace(/[?]/g, "\\?")}$`));
  await expect(page.getByRole("button", { name: "Copier le lien" })).toBeVisible();

  await open.click();
  await expect(page).toHaveURL(/\/suivi\/RNB-/);
  trackingUrl = new URL(page.url()).pathname + new URL(page.url()).search;
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Demande reçue/i);
  await expect(page.getByText(reference).first()).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText("Reçue");
  await expect(page.getByText("Prix estimé")).toBeVisible();
  await expect(page.getByText("En direct", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ajouter des photos/ })).toBeVisible();
  // Appeler : un simple lien (sans numéro réglé, il mène à /contact) ; jamais de nom ni de téléphone du client.
  await expect(page.locator('a[href^="tel:"], a[href="/contact"]').first()).toBeAttached();
  await expect(page.getByText(CLIENT)).toHaveCount(0);
  await expect(page.getByText("06 12 34 56 78")).toHaveCount(0);
  await expect(page.locator("h1")).toHaveCount(1);

  // Chaque lien de la page de suivi (valide) mène quelque part ; « Actualiser » garde le jeton.
  const hrefs = await page.locator("#contenu a[href]").evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  expect(hrefs).toContain(trackingUrl);
  for (const href of new Set(hrefs)) {
    if (href.startsWith("tel:")) expect(href).toMatch(/^tel:\+?\d{3,15}$/);
    else if (href.startsWith("https://wa.me/")) expect(href).toMatch(new RegExp(`^https://wa\\.me/\\d{8,15}\\?text=.*${reference}`));
    else if (href.startsWith("/")) expect((await page.request.get(href, { maxRedirects: 0 })).status(), href).toBe(200);
  }
});

test("le suivi change tout seul quand RNB AUTO avance l'intervention", async ({ page, browser }) => {
  test.setTimeout(150_000);
  expect(trackingUrl).not.toBe("");
  await page.goto(trackingUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Demande reçue/i);

  const context = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 390, height: 844 } });
  const admin = await context.newPage();
  await signIn(admin);
  await admin.goto("/admin/demandes");
  await admin.getByRole("link", { name: new RegExp(`^${CLIENT}`) }).first().click();
  await admin.getByRole("button", { name: "Accepter" }).click();
  await expect(admin.getByText("Statut : Acceptée")).toBeVisible();
  await admin.getByRole("button", { name: "Je pars" }).click();
  await expect(admin.getByText("Statut : Dépanneuse en route")).toBeVisible();
  await context.close();

  // Sans recharger : la page se met à jour (lecture toutes les 20 s).
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/en route/i, { timeout: 45_000 });
  await expect(page.locator('[aria-current="step"]')).toContainText("En route");
  await expect(page.getByText("Prix confirmé")).toBeVisible();
});

test("lien faux : message clair, Appeler et Demander restent là ; photos refusées sans le bon jeton", async ({ page, request }) => {
  expect(trackingUrl).not.toBe("");
  const [path, query] = trackingUrl.split("?") as [string, string];
  const reference = decodeURIComponent(path.split("/").pop() as string);
  const token = new URLSearchParams(query).get("t") as string;

  await page.goto(`${path}?t=${"x".repeat(32)}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/non valable/i);
  await expect(page.locator("#contenu").getByRole("link", { name: /Faire une demande/ })).toHaveAttribute("href", "/demande");
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/non valable/i);

  const photo = { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };
  const refused = await request.post("/api/suivi/photos", { multipart: { photo, reference }, headers: { Authorization: `Bearer ${"x".repeat(32)}` } });
  expect(refused.status()).toBe(403);
  const anonymous = await request.post("/api/suivi/photos", { multipart: { photo, reference } });
  expect(anonymous.status()).toBe(401);
  // Bon jeton, fichier qui n'est pas une vraie photo : refusé par le contrôle du contenu, pas par le lien.
  const invalidFile = await request.post("/api/suivi/photos", { multipart: { photo, reference }, headers: { Authorization: `Bearer ${token}` } });
  expect(invalidFile.status()).toBe(415);
});

test("demande annulée : le suivi le dit, sans prix ni ajout de photos", async ({ page, browser }) => {
  test.setTimeout(120_000);
  expect(trackingUrl).not.toBe("");
  const context = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 390, height: 844 } });
  const admin = await context.newPage();
  await signIn(admin);
  await admin.goto("/admin/demandes");
  await admin.getByRole("link", { name: new RegExp(`^${CLIENT}`) }).first().click();
  await admin.getByRole("button", { name: "Annuler la demande" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Annuler la demande" }).click();
  await expect(admin.getByText("Statut : Annulée")).toBeVisible();
  await context.close();

  await page.goto(trackingUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/annulée/i);
  await expect(page.locator('[aria-current="step"]')).toContainText("Annulée");
  await expect(page.getByText("Suivi terminé")).toBeVisible();
  await expect(page.getByText("Prix estimé")).toHaveCount(0);
  await expect(page.getByText("Prix confirmé")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Ajouter des photos/ })).toHaveCount(0);
  // Les étapes jamais atteintes ne sont pas listées après une annulation.
  await expect(page.locator("#etapes + ol li")).toHaveCount(4);
});
