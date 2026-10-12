import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Vault-Demo-2026!";

export const ACCOUNTS = {
  admin: "admin@vault-demo.test",
  comptable: "comptable@vault-demo.test",
  lecteur: "lecteur@vault-demo.test",
} as const;

/** Saisit email et mot de passe sur l'écran de connexion. */
export async function submitCredentials(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

/** Valide la double authentification avec le code affiché par le mode démonstration. */
export async function passMfa(page: Page) {
  await expect(page).toHaveURL(/\/connexion\/2fa$/);
  const code = (await page.getByText(/^\d{3} \d{3}$/).textContent())!.replace(/\s/g, "");
  await page.locator('input[name="code"]').fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
}

export async function acceptCharter(page: Page) {
  await expect(page).toHaveURL(/\/charte$/);
  await page.getByText("J'ai lu et j'accepte la charte de confidentialité.").click();
  await page.getByRole("button", { name: /Accéder à l'espace confidentiel/ }).click();
}

/** Parcours complet jusqu'au tableau de bord. */
export async function login(page: Page, email: string) {
  await submitCredentials(page, email);
  await passMfa(page);
  if (/\/charte$/.test(new URL(await waitForStage(page)).pathname)) await acceptCharter(page);
  await expect(page).toHaveURL(/\/app$/);
}

async function waitForStage(page: Page) {
  await page.waitForURL(/\/(charte|app)$/);
  return page.url();
}
