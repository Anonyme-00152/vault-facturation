import { execSync } from "node:child_process";

/** Applique les migrations puis recharge les données de démonstration dans la base de test. */
export default function setup() {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://vault:vault@localhost:5433/vault_test",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "integration-secret-integration-secret-00",
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? Buffer.alloc(32, 11).toString("base64"),
    ENCRYPTION_KEY_ID: process.env.ENCRYPTION_KEY_ID ?? "k1",
    BLIND_INDEX_KEY: process.env.BLIND_INDEX_KEY ?? Buffer.alloc(32, 13).toString("base64"),
    LOG_LEVEL: "silent",
  };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("npm run db:seed", { env, stdio: "pipe" });
}
