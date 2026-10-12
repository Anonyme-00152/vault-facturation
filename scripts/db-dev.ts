/**
 * Lance un vrai PostgreSQL local, sans Docker ni installation (binaires fournis par npm).
 * Données conservées dans `.pgdata/`. À utiliser uniquement en développement.
 *
 *   npm run db:dev        puis, dans un autre terminal : npm run dev
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.PGPORT ?? 5433);
const dataDir = resolve(".pgdata");
const firstRun = !existsSync(dataDir);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "vault",
  password: "vault",
  port: PORT,
  persistent: true,
  // UTF-8 explicite : sous Windows, initdb choisirait sinon l'encodage WIN1252.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: (message) => {
    if (process.env.PG_VERBOSE) console.log(String(message).trim());
  },
});

async function main() {
  if (firstRun) await pg.initialise();
  await pg.start();

  const client = pg.getPgClient();
  await client.connect();
  for (const name of ["vault", "vault_test"]) {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (exists.rowCount === 0) await pg.createDatabase(name);
  }
  await client.end();

  console.log(`PostgreSQL prêt sur le port ${PORT} (bases : vault, vault_test). Ctrl+C pour arrêter.`);

  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch(async (error) => {
  console.error(error);
  await pg.stop().catch(() => {});
  process.exit(1);
});
