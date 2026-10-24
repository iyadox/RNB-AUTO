import { expect, test, type Page } from "@playwright/test";

/**
 * Contrôle du back-office : lien de suivi envoyé depuis la fiche (demande saisie au téléphone),
 * fin de session visible, formulaire d'accès qui garde ce qui a été tapé en cas d'erreur.
 * Rangé après `parcours.spec.ts` (même raison que `admin-back-office.spec.ts`) ; lancé seul,
 * il fait lui-même l'installation avec le même compte.
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

test("le lien de suivi part de la fiche et ouvre le suivi du client", async ({ page, browser }) => {
  await signIn(page);
  await page.goto("/admin/demandes/nouvelle");
  await chooseAddress(page, "Où est le véhicule ?", "Pantin");
  await chooseAddress(page, "Destination", "Montreuil");
  await page.getByRole("radio", { name: /Berline/ }).click();
  await page.getByRole("button", { name: "Calculer" }).click();
  await page.getByRole("textbox", { name: "Nom du client" }).fill("Client Lien");
  await page.getByRole("textbox", { name: "Téléphone du client" }).fill("06 11 22 33 55");
  await page.getByRole("button", { name: "Créer la demande" }).click();
  await expect(page).toHaveURL(/\/admin\/demandes\/[0-9a-f-]{36}$/);
  const reference = (await page.title()).match(/RNB-\d{4}-\d+/)?.[0];
  expect(reference).toBeTruthy();

  await page.getByRole("button", { name: "Envoyer le lien de suivi" }).click();
  const field = page.getByRole("textbox", { name: "Lien de suivi" });
  await expect(field).toBeVisible();
  const url = await field.inputValue();
  expect(url).toContain(`/suivi/${reference}?t=`);
  const whatsapp = await page.locator("a[href^='https://wa.me/33611223355']").last().getAttribute("href");
  expect(decodeURIComponent(whatsapp ?? "")).toContain(url);
  await expect(page.getByText("Lien de suivi créé pour le client.")).toBeVisible();

  const visitor = await browser.newContext();
  const client = await visitor.newPage();
  const response = await client.goto(url);
  expect(response?.status()).toBe(200);
  await expect(client.getByText(reference!).first()).toBeVisible();
  await visitor.close();
});

test("un nouvel accès refusé garde le nom et l'email tapés", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/parametres/acces");
  await page.locator("input[name=name]").fill("Personne Essai");
  await page.locator("input[name=email]").fill("personne.essai@exemple.test");
  await page.locator("input[name=password]").fill("Mot-de-passe-2026");
  await page.locator("input[name=confirm]").fill("Autre-mot-2026");
  await page.getByRole("button", { name: "Donner l'accès" }).click();
  await expect(page.getByText("Les deux mots de passe sont différents.")).toBeVisible();
  await expect(page.locator("input[name=name]")).toHaveValue("Personne Essai");
  await expect(page.locator("input[name=email]")).toHaveValue("personne.essai@exemple.test");
  await expect(page.locator("input[name=password]")).toHaveValue("");
});

test("une session terminée se voit : plus d'alerte silencieuse", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin");
  // La session est supprimée (autre appareil, accès suspendu…) mais le cookie reste.
  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name.endsWith("rnb_session"));
  expect(session).toBeTruthy();
  await page.context().addCookies([{ ...session!, value: "z".repeat(43) }]);
  await expect(page.getByText("Vous êtes déconnecté")).toBeVisible({ timeout: 40_000 });
  await expect(page.getByRole("link", { name: "Se reconnecter" })).toHaveAttribute("href", "/admin/connexion");
});
