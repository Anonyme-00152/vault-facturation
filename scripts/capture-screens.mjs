/**
 * Captures d'écran des pages principales, en clair et en sombre.
 *   node scripts/capture-screens.mjs [dossier de sortie] [chemins…]
 * Le serveur doit tourner sur BASE_URL (http://localhost:3000 par défaut).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = process.argv[2] ?? "docs/screenshots";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/connexion", "/app"];
const fullPage = process.env.FULL_PAGE === "1";
const width = Number(process.env.WIDTH ?? 1440);
const height = Number(process.env.HEIGHT ?? 900);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: scheme,
    locale: "fr-FR",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  for (const path of paths) {
    await page.goto(new URL(path, baseURL).toString(), { waitUntil: "networkidle" });
    await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 2500));
    if (fullPage) {
      // Fait défiler la page pour déclencher les animations d'apparition.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
    }
    const name = `${path === "/" ? "accueil" : path.replaceAll("/", "-").replace(/^-/, "")}-${scheme}.png`;
    await page.screenshot({ path: join(outDir, name), fullPage });
    console.log(`✓ ${name}`);
  }
  await context.close();
}

await browser.close();
