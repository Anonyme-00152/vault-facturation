import { expect, test } from "@playwright/test";

import { ACCOUNTS, login } from "./helpers";

test.describe("permissions par rôle", () => {
  test("le lecteur consulte sans pouvoir créer, administrer ni exporter", async ({ page }) => {
    await login(page, ACCOUNTS.lecteur);

    await page.goto("/app/clients");
    await expect(page.getByRole("heading", { name: "Clients", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nouveau client" })).toHaveCount(0);

    await page.goto("/app/clients/nouveau");
    await expect(page.getByRole("heading", { name: /Cette porte reste fermée/ })).toBeVisible();

    await page.goto("/app/admin/audit");
    await expect(page.getByRole("heading", { name: /Cette porte reste fermée/ })).toBeVisible();

    await page.goto("/app/factures");
    await page.locator("tbody a").first().click();
    await expect(page.getByText("Consultation seule")).toBeVisible();
    const pdf = await page.request.get(`${page.url().replace("/app/factures/", "/api/factures/")}/pdf`);
    expect(pdf.status()).toBe(403);
  });

  test("l'administrateur gère le journal mais ne crée pas de factures", async ({ page }) => {
    await login(page, ACCOUNTS.admin);

    await page.goto("/app/admin/audit");
    await expect(page.getByRole("heading", { name: "Journal d'audit" })).toBeVisible();
    await page.getByRole("button", { name: "Vérifier l'intégrité" }).click();
    await expect(page.getByText(/Chaîne intègre : \d+ entrées vérifiées/)).toBeVisible();

    const csv = await page.request.get("/api/audit/export");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("rang;date_utc;utilisateur");

    await page.goto("/app/factures/nouvelle");
    await expect(page.getByRole("heading", { name: /Cette porte reste fermée/ })).toBeVisible();
  });
});
