/**
 * Données de démonstration.
 *   npm run db:seed               vide les tables métier puis les remplit
 *   npm run db:seed -- --if-empty ne fait rien si des utilisateurs existent
 */
import "dotenv/config";

import { db } from "@/server/db";
import { seedDemo } from "@/server/demo/seed";

const ifEmpty = process.argv.includes("--if-empty");

seedDemo({ reset: !ifEmpty, ifEmpty })
  .then((result) => {
    console.log(result.skipped ? "Base déjà remplie : seed ignoré." : "Données de démonstration chargées.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
