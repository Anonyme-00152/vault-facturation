// Base dédiée aux tests d'intégration : jamais la base de développement.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://vault:vault@localhost:5433/vault_test";
process.env.AUTH_SECRET ??= "integration-secret-integration-secret-00";
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 11).toString("base64");
process.env.ENCRYPTION_KEY_ID ??= "k1";
process.env.BLIND_INDEX_KEY ??= Buffer.alloc(32, 13).toString("base64");
process.env.LOG_LEVEL ??= "silent";
