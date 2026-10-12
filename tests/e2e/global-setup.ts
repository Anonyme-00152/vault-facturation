import { execSync } from "node:child_process";

/** Données de démonstration fraîches avant chaque campagne de tests de bout en bout. */
export default function globalSetup() {
  if (process.env.E2E_SKIP_SEED) return;
  execSync("npm run db:seed", { stdio: "inherit" });
}
