// Configuration de test : clés factices, jamais utilisées ailleurs.
process.env.DATABASE_URL ??= "postgresql://vault:vault@localhost:5433/vault_test";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-0000";
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
process.env.ENCRYPTION_KEY_ID ??= "k1";
process.env.BLIND_INDEX_KEY ??= Buffer.alloc(32, 9).toString("base64");
process.env.LOG_LEVEL ??= "silent";
