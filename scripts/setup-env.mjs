/**
 * Crée `.env` à partir de `.env.example` en générant des secrets aléatoires.
 * Ne remplace jamais un `.env` existant.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log(".env existe déjà : rien à faire.");
  process.exit(0);
}

const secret = () => randomBytes(32).toString("base64");
const content = readFileSync(".env.example", "utf8")
  .replace(/^AUTH_SECRET=""$/m, `AUTH_SECRET="${secret()}"`)
  .replace(/^ENCRYPTION_KEY=""$/m, `ENCRYPTION_KEY="${secret()}"`)
  .replace(/^BLIND_INDEX_KEY=""$/m, `BLIND_INDEX_KEY="${secret()}"`);

writeFileSync(".env", content, { mode: 0o600 });
console.log(".env créé avec des clés aléatoires.");
