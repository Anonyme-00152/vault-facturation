import { expect, test } from "@playwright/test";

import { ACCOUNTS, acceptCharter, passMfa, submitCredentials } from "./helpers";

test.describe("authentification", () => {
  test("refuse des identifiants invalides sans révéler si le compte existe", async ({ page }) => {
    await submitCredentials(page, "inconnu@vault-demo.test", "un-mauvais-mot-de-passe");
    await expect(page.locator("p[role=alert]")).toHaveText("Adresse e-mail ou mot de passe incorrect.");

    await submitCredentials(page, ACCOUNTS.lecteur, "un-mauvais-mot-de-passe");
    await expect(page.locator("p[role=alert]")).toHaveText("Adresse e-mail ou mot de passe incorrect.");
  });

  test("redirige vers la connexion sans session", async ({ page, request }) => {
    await page.goto("/app/factures");
    await expect(page).toHaveURL(/\/connexion$/);
    const api = await request.get("/api/factures/00000000-0000-7000-8000-000000000000/pdf", { maxRedirects: 0 });
    expect(api.status()).toBe(401);
  });

  test("impose la double authentification avant toute donnée", async ({ page }) => {
    await submitCredentials(page, ACCOUNTS.comptable);
    await expect(page).toHaveURL(/\/connexion\/2fa$/);

    // Mot de passe valide mais 2FA non faite : les données restent inaccessibles.
    await page.goto("/app/clients");
    await expect(page).toHaveURL(/\/connexion\/2fa$/);

    await page.locator('input[name="code"]').fill("000000");
    await page.getByRole("button", { name: "Valider" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("Code incorrect");
  });
});

test.describe("charte de confidentialité", () => {
  test("bloque les données côté serveur tant qu'elle n'est pas acceptée", async ({ page, context }) => {
    await submitCredentials(page, ACCOUNTS.comptable);
    await passMfa(page);
    await expect(page).toHaveURL(/\/charte$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accès réservé – Informations confidentielles");

    // Navigation directe, requête d'API : tout est refusé avant acceptation.
    await page.goto("/app/clients");
    await expect(page).toHaveURL(/\/charte$/);
    const api = await context.request.get("/api/audit/export", { maxRedirects: 0 });
    expect(api.status()).toBe(401);

    // Le bouton reste inactif tant que la case n'est pas cochée.
    await expect(page.getByRole("button", { name: /Accéder à l'espace confidentiel/ })).toBeDisabled();
    await acceptCharter(page);
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { name: "Bonjour, Camille." })).toBeVisible();
  });
});
