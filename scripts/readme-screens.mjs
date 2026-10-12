/**
 * Captures d'écran du README (nécessite le mode démonstration et des données fraîches).
 *   BASE_URL=http://localhost:3000 node scripts/readme-screens.mjs
 */
import { mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const PASSWORD = process.env.DEMO_PASSWORD ?? "Vault-Demo-2026!";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function session(email, scheme) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, locale: "fr-FR" });
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  return { context, page };
}

async function shot(page, name, options = {}) {
  await page.waitForTimeout(options.settle ?? 1500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: options.fullPage ?? false });
  console.log(`✓ ${name}`);
}

async function login(page, email, { stopAtCharter = false } = {}) {
  await page.goto(`${BASE}/connexion`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/connexion\/2fa$/);
  const code = (await page.getByText(/^\d{3} \d{3}$/).textContent()).replace(/\s/g, "");
  await page.locator('input[name="code"]').fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL(/\/(charte|app)$/);
  if (page.url().endsWith("/charte")) {
    if (stopAtCharter) return;
    await page.getByText("J'ai lu et j'accepte la charte de confidentialité.").click();
    await page.getByRole("button", { name: /Accéder/ }).click();
    await page.waitForURL(/\/app$/);
  }
}

// Pages publiques
{
  const { context, page } = await session(null, "light");
  await page.goto(BASE);
  await shot(page, "accueil", { settle: 4000 });
  await context.close();
}
{
  const { context, page } = await session(null, "dark");
  await page.goto(`${BASE}/connexion`);
  await shot(page, "connexion", { settle: 3500 });
  await context.close();
}

// Comptable : charte, tableau de bord, clients, facture
{
  const { context, page } = await session(null, "light");
  await login(page, "comptable@vault-demo.test", { stopAtCharter: true });
  await shot(page, "charte");
  await page.getByText("J'ai lu et j'accepte la charte de confidentialité.").click();
  await page.getByRole("button", { name: /Accéder/ }).click();
  await page.waitForURL(/\/app$/);
  await shot(page, "tableau-de-bord");
  await page.goto(`${BASE}/app/clients`);
  await shot(page, "clients");
  await page.goto(`${BASE}/app/factures?statut=payees`);
  await page.locator("tbody a").first().click();
  await page.waitForURL(/\/app\/factures\/[0-9a-f-]{36}/);
  await shot(page, "facture");
  await context.close();
}
{
  const { context, page } = await session(null, "dark");
  await login(page, "comptable@vault-demo.test");
  await shot(page, "tableau-de-bord-sombre");
  await page.goto(`${BASE}/app/factures/nouvelle`);
  await page.getByRole("button", { name: "Atelier de cadrage (demi-journée)" }).click();
  await page.getByRole("button", { name: "Conception des maquettes (jour)" }).click();
  await shot(page, "editeur-facture-sombre");
  await context.close();
}

// Administrateur : journal d'audit
{
  const { context, page } = await session(null, "light");
  await login(page, "admin@vault-demo.test");
  await page.goto(`${BASE}/app/admin/audit`);
  await page.getByRole("button", { name: "Vérifier l'intégrité" }).click();
  await page.getByText(/Chaîne intègre/).waitFor();
  await shot(page, "journal-audit");
  await context.close();
}

await browser.close();
