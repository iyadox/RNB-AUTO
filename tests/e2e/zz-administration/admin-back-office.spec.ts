import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Back-office : tableau de bord, veille des nouvelles demandes, fiche (appel, journal, itinéraire,
 * étapes), bon d'intervention, filtres, compte et accès.
 *
 * Ce fichier est rangé dans un sous-dossier pour passer APRÈS `parcours.spec.ts` (Playwright suit
 * l'ordre alphabétique) : `parcours` crée le premier compte par la page d'installation. Lancé seul,
 * ce fichier fait lui-même l'installation, avec le même compte.
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { name: "Administrateur", email: "admin@exemple.test", password: "Essai-2026-tarifs" };

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

async function chooseAddress(page: Page, label: string, query: string) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("option").first().click();
}

/** Saisit une demande « appel » (sans l'accepter) et renvoie l'adresse de sa fiche. */
async function createPhoneRequest(page: Page, name: string): Promise<string> {
  await page.goto("/admin/demandes/nouvelle");
  await chooseAddress(page, "Où est le véhicule ?", "Pantin");
  await chooseAddress(page, "Destination", "Montreuil");
  await page.getByRole("radio", { name: /Berline/ }).click();
  await page.getByRole("button", { name: "Calculer" }).click();
  await page.getByRole("textbox", { name: "Nom du client" }).fill(name);
  await page.getByRole("textbox", { name: "Téléphone du client" }).fill("06 11 22 33 44");
  const accept = page.getByRole("switch", { name: "Le client a accepté le prix" });
  if ((await accept.getAttribute("aria-checked")) === "true") await accept.click();
  await page.getByRole("button", { name: "Créer la demande" }).click();
  await expect(page).toHaveURL(/\/admin\/demandes\/[0-9a-f-]{36}$/);
  return new URL(page.url()).pathname;
}

async function newAdminPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await signIn(page);
  return page;
}

let requestPath = "";

test("le tableau de bord montre l'essentiel et mène droit au réglage manquant", async ({ page }) => {
  await signIn(page);
  requestPath = await createPhoneRequest(page, "Client Bureau");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "À traiter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accepter : Client Bureau" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chiffre d'affaires" })).toBeVisible();
  await expect(page.getByText("Pour démarrer")).toBeVisible();
  // Le compteur de nouvelles demandes s'affiche dans l'onglet.
  await expect.poll(() => page.title()).toMatch(/^\(\d+\) Accueil/);
  // « Numéro de téléphone » mène au champ, prêt à être rempli.
  await page.getByRole("link", { name: /Numéro de téléphone/ }).click();
  await expect(page).toHaveURL(/\/admin\/parametres\/entreprise#reglage-company-phone$/);
  await expect(page.locator("#reglage-company-phone input")).toBeFocused();
});

test("la veille des demandes est réservée aux comptes connectés", async ({ page, browser }) => {
  await signIn(page);
  const response = await page.request.get("/admin/etat");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { newCount: number; latest: { reference: string } | null };
  expect(body.newCount).toBeGreaterThan(0);
  expect(body.latest?.reference).toMatch(/^RNB-\d{4}-\d{5}$/);
  expect(response.headers()["cache-control"]).toContain("no-store");

  const stranger = await browser.newContext();
  await stranger.addCookies([{ name: "rnb_session", value: "x".repeat(43), url: "http://localhost:3100" }]);
  const refused = await stranger.request.get("/admin/etat");
  expect(refused.status()).toBe(401);
  await stranger.close();
});

test("une nouvelle demande déclenche une alerte discrète dans l'espace", async ({ page, browser }) => {
  test.setTimeout(150_000);
  await signIn(page);
  await page.goto("/admin/demandes");
  const other = await newAdminPage(browser);
  await createPhoneRequest(other, "Client Alerte");
  await other.context().close();
  const banner = page.getByRole("status").filter({ hasText: "Nouvelle demande" });
  await expect(banner).toContainText("Client Alerte", { timeout: 45_000 });
  await banner.getByRole("link", { name: "Voir" }).click();
  await expect(page.getByRole("heading", { name: "Client Alerte" })).toBeVisible();
});

test("la fiche : appel, journal, itinéraire, étapes et bon d'intervention", async ({ page }) => {
  await signIn(page);
  await page.goto(requestPath);
  await expect(page.getByRole("heading", { name: "Client Bureau" })).toBeVisible();

  // Liens d'action : appel, WhatsApp et SMS préremplis, itinéraire avec étape.
  await expect(page.getByRole("link", { name: "Appeler", exact: true })).toHaveAttribute("href", "tel:+33611223344");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/33611223344\?text=Bonjour/);
  await expect(page.getByRole("link", { name: /SMS/ })).toHaveAttribute("href", /^sms:\+33611223344\?&body=/);
  await expect(page.getByRole("link", { name: /Itinéraire complet/ })).toHaveAttribute("href", /waypoints=/);

  // Appel sans réponse : la demande passe « À rappeler ».
  await page.getByRole("button", { name: "Pas de réponse" }).click();
  await expect(page.getByText("Noté. La demande passe « À rappeler ».")).toBeVisible();
  await expect(page.getByText("Appel sans réponse.")).toBeVisible();

  // Note datée dans le journal.
  await page.getByLabel("Ajouter au journal").fill("Rappeler après 14 h");
  await page.getByRole("button", { name: "Noter" }).click();
  await expect(page.getByText("Rappeler après 14 h")).toBeVisible();

  // Étapes en un geste.
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByText("Statut : Acceptée")).toBeVisible();
  await page.getByRole("button", { name: "Je pars" }).click();
  await expect(page.getByText("Statut : Dépanneuse en route")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Avancement de l'intervention" })).toContainText("Étape 3 sur 7");

  // Bon d'intervention.
  await page.getByRole("link", { name: /Bon d'intervention/ }).click();
  await expect(page.getByRole("heading", { name: "Bon d'intervention" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimer" })).toBeVisible();
  await expect(page.getByText("Client Bureau")).toBeVisible();
  await expect(page.getByText("À COMPLÉTER").first()).toBeVisible();
});

test("la liste filtre par étape, par origine et par recherche", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/demandes?statut=sur-la-route&origine=appel");
  await expect(page.getByRole("link", { name: /^Client Bureau/ })).toBeVisible();
  await page.goto("/admin/demandes?statut=toutes&origine=site");
  await expect(page.getByRole("link", { name: /^Client Bureau/ })).toHaveCount(0);
  await page.goto("/admin/demandes?statut=toutes");
  await page.getByRole("searchbox", { name: "Rechercher une demande" }).fill("33 44");
  await page.getByRole("button", { name: "Chercher" }).click();
  await expect(page).toHaveURL(/q=33\+44/);
  await expect(page.getByRole("link", { name: /^Client Bureau/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Client Essai/ })).toHaveCount(0);
});

test("compte et accès : appareils connectés, nouvel accès puis suspension", async ({ page, browser }) => {
  await signIn(page);
  await page.goto("/admin/parametres/compte");
  await expect(page.getByRole("heading", { name: "Appareils connectés" })).toBeVisible();
  await expect(page.getByText("Cet appareil").first()).toBeVisible();

  await page.goto("/admin/parametres/acces");
  await page.locator("input[name=name]").fill("Second Accès");
  await page.locator("input[name=email]").fill("second@exemple.test");
  await page.locator("input[name=password]").fill("Deuxieme-acces-2026");
  await page.locator("input[name=confirm]").fill("Deuxieme-acces-2026");
  await page.getByRole("button", { name: "Donner l'accès" }).click();
  await expect(page.getByText("Accès créé pour Second Accès")).toBeVisible();
  const row = page.getByRole("listitem").filter({ hasText: "second@exemple.test" });
  await row.getByRole("button", { name: "Suspendre" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suspendre l'accès" }).click();
  await expect(row.getByText("Suspendu")).toBeVisible();

  // L'accès suspendu ne permet plus d'entrer.
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("/admin/connexion");
  await other.locator("input[name=email]").fill("second@exemple.test");
  await other.locator("input[name=password]").fill("Deuxieme-acces-2026");
  await other.locator("button[type=submit]").click();
  await expect(other.getByText("Email ou mot de passe incorrect.")).toBeVisible();
  await context.close();
});
