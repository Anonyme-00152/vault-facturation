import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
const out = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR", colorScheme: "light" });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
page.on("pageerror", (e) => errors.push("pageerror " + e.message.slice(0, 200)));
const T = 120000;
await page.goto("http://localhost:3000/connexion", { timeout: T });
await page.getByLabel("Adresse e-mail").fill("comptable@vault-demo.test");
await page.getByLabel("Mot de passe", { exact: true }).fill("Vault-Demo-2026!");
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL(/2fa/, { timeout: T });
const code = (await page.getByText(/^\d{3} \d{3}$/).textContent()).replace(/\s/g, "");
await page.locator('input[name="code"]').fill(code);
await page.getByRole("button", { name: "Valider" }).click();
await page.waitForURL(/\/(charte|app)$/, { timeout: T });
if (page.url().endsWith("/charte")) {
  await page.screenshot({ path: `${out}/charte.png` });
  await page.getByText("J'ai lu et j'accepte la charte de confidentialité.").click();
  await page.getByRole("button", { name: /Accéder/ }).click();
  await page.waitForURL(/\/app$/, { timeout: T });
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/dashboard.png` });
for (const [name, path] of [["clients", "/app/clients"], ["factures", "/app/factures"], ["compte", "/app/compte"], ["nouvelle-facture", "/app/factures/nouvelle"], ["nouveau-client", "/app/clients/nouveau"]]) {
  await page.goto(`http://localhost:3000${path}`, { timeout: T });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: name !== "dashboard" });
}
await page.goto("http://localhost:3000/app/clients", { timeout: T });
await page.locator("tbody a").first().click();
await page.waitForURL(/\/app\/clients\/[0-9a-f-]{36}/, { timeout: T });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/client.png`, fullPage: true });
await page.goto("http://localhost:3000/app/factures?statut=en-retard", { timeout: T });
await page.locator("tbody a").first().click();
await page.waitForURL(/\/app\/factures\/[0-9a-f-]{36}/, { timeout: T });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/facture.png`, fullPage: true });
const pdfUrl = page.url().replace("/app/factures/", "/api/factures/") + "/pdf";
const pdf = await page.request.get(pdfUrl);
console.log("PDF", pdf.status(), pdf.headers()["content-type"]);
writeFileSync(`${out}/facture.pdf`, await pdf.body());
console.log("erreurs console:", errors.length ? errors : "aucune");
await browser.close();
