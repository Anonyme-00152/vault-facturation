import { expect, test } from "@playwright/test";

import { ACCOUNTS, login } from "./helpers";

test("le comptable crée un client, le facture, émet la facture et l'exporte", async ({ page }) => {
  await login(page, ACCOUNTS.comptable);

  // Client
  await page.goto("/app/clients/nouveau");
  await page.getByLabel("Raison sociale").fill("Société Essai Bout-en-Bout SAS");
  await page.getByLabel("SIRET").fill("000 427 310 00016");
  await page.getByLabel("E-mail de facturation").fill("compta@essai-e2e.test");
  await page.getByLabel("Téléphone").fill("01 99 00 42 42");
  await page.getByLabel("Adresse", { exact: true }).fill("7 rue des Essais");
  await page.getByLabel("Code postal").fill("69002");
  await page.getByLabel("Ville").fill("Lyon");
  await page.getByRole("button", { name: "Créer le client" }).click();
  await expect(page.getByRole("heading", { name: "Société Essai Bout-en-Bout SAS" })).toBeVisible();
  await expect(page.getByText("compta@essai-e2e.test")).toBeVisible();

  // Brouillon : 2 jours à 600 € + 20 % de TVA = 1 440 € TTC
  await page.getByRole("link", { name: "Nouvelle facture" }).click();
  await page.getByLabel("Désignation de la ligne 1").fill("Développement front-end (jour)");
  await page.getByLabel("Quantité de la ligne 1").fill("2");
  await page.getByLabel("Prix unitaire HT de la ligne 1").fill("600");
  await expect(page.getByText("1 440,00 €").first()).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page.getByRole("heading", { name: "Brouillon", level: 1 })).toBeVisible();

  // Émission : numéro attribué, facture figée
  await page.getByRole("button", { name: "Émettre la facture" }).click();
  await page.getByRole("button", { name: "Émettre", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^FAC-\d{4}-\d{6}$/);
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);

  // PDF filigrané
  const pdf = await page.request.get(`${page.url().split("?")[0]!.replace("/app/factures/", "/api/factures/")}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");

  // Encaissement
  await page.getByRole("button", { name: "Marquer comme payée" }).click();
  await expect(page.getByText("Payée").first()).toBeVisible();
});
