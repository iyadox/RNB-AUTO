import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours principaux, dans l'ordre d'une première utilisation :
 * site public → demande en ligne → installation de l'administration → simulateur → demande.
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { name: "Administrateur", email: "admin@exemple.test", password: "Essai-2026-tarifs" };

async function chooseAddress(page: Page, label: string, query: string) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("option").first().click();
}

test("le site public s'affiche et les boutons d'appel restent des liens", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const path of ["/depannage", "/remorquage", "/zones-d-intervention", "/panne-autoroute", "/questions-frequentes", "/contact", "/mentions-legales", "/confidentialite"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
  // Tant que le numéro n'est pas renseigné, le site l'indique clairement.
  await page.goto("/contact");
  await expect(page.getByText("À COMPLÉTER").first()).toBeVisible();
});

test("un client obtient une estimation et envoie sa demande", async ({ page }) => {
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
  await expect(page.getByText("Prix estimé")).toBeVisible();
  await expect(page.getByText(/\d+\s?€/).first()).toBeVisible();
  await page.getByRole("button", { name: /Demander le dépannage/ }).click();
  await page.getByPlaceholder("Votre nom").fill("Client Essai");
  await page.getByPlaceholder("06 12 34 56 78").fill("06 12 34 56 78");
  await page.locator("input[type=checkbox]").last().check();
  await page.waitForTimeout(2600); // temps minimal de remplissage (protection contre les robots)
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();
  await expect(page.getByText("Demande reçue")).toBeVisible();
  await expect(page.getByText(/RNB-\d{4}-\d{5}/)).toBeVisible();
});

test("installation, simulateur et traitement d'une demande dans l'administration", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/(installation|connexion)/);
  await page.goto("/admin/installation");
  await page.locator("input[name=name]").fill(ADMIN.name);
  await page.locator("input[name=email]").fill(ADMIN.email);
  await page.locator("input[name=password]").fill(ADMIN.password);
  await page.locator("input[name=confirm]").fill(ADMIN.password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Pour démarrer")).toBeVisible();

  // Simulateur « Tester mes tarifs » : le détail complet s'affiche.
  await page.goto("/admin/tester");
  await chooseAddress(page, "Où est le véhicule ?", "Cergy");
  await chooseAddress(page, "Destination", "Montreuil");
  await page.getByRole("radio", { name: "Dimanche" }).click();
  await page.getByLabel("Heure").fill("23:00");
  await page.getByRole("radio", { name: /SUV/ }).click();
  await page.getByRole("checkbox", { name: /Véhicule non roulant/ }).click();
  await page.getByRole("button", { name: "Calculer" }).click();
  await expect(page.getByText("Prix final client").first()).toBeVisible();
  await expect(page.getByText("Coût estimé pour l'entreprise")).toBeVisible();
  await expect(page.getByText("Marge estimée").first()).toBeVisible();

  // La demande envoyée depuis le site est là : on l'accepte.
  await page.goto("/admin/demandes");
  await page.getByRole("link", { name: /^Client Essai/ }).click();
  await expect(page.getByRole("heading", { name: "Client Essai" })).toBeVisible();
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByText("Statut : Acceptée")).toBeVisible();
  await expect(page.getByRole("button", { name: "Je pars" })).toBeVisible();
});

test("l'administration est fermée sans connexion", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/admin/tarifs");
  await expect(page).toHaveURL(/\/admin\/connexion/);
  const upload = await page.request.post("/api/demandes/photos", { multipart: { photo: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) } } });
  expect(upload.status()).toBe(401);
  await context.close();
});
