import "server-only";
import { z } from "zod";

/** Clé symétrique de 256 bits encodée en base64. */
const key256 = z
  .string()
  .refine((value) => Buffer.from(value, "base64").length === 32, {
    message: "doit être une clé de 32 octets encodée en base64 (openssl rand -base64 32)",
  });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "doit être une URL PostgreSQL"),
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "doit contenir au moins 32 caractères"),
  /** Clé AES-256-GCM courante pour le chiffrement des champs sensibles. */
  ENCRYPTION_KEY: key256,
  /** Identifiant de la clé courante, écrit dans chaque valeur chiffrée (rotation). */
  ENCRYPTION_KEY_ID: z
    .string()
    .regex(/^[a-z0-9]{1,8}$/, "lettres minuscules et chiffres, 8 caractères maximum")
    .default("k1"),
  /** Anciennes clés encore nécessaires au déchiffrement : `k0:base64,k00:base64`. */
  ENCRYPTION_KEYS_PREVIOUS: z.string().default(""),
  /** Clé HMAC pour l'index aveugle (recherche exacte sur un champ chiffré). */
  BLIND_INDEX_KEY: key256,
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Lit et valide la configuration une seule fois.
 * Appelée au démarrage du serveur (`instrumentation.ts`) : l'application refuse
 * de démarrer si une variable manque ou est invalide. Les valeurs ne sont jamais affichées.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Configuration invalide :\n${z.prettifyError(parsed.error)}`);
  }
  cached = parsed.data;
  return cached;
}

/** Réservé aux tests : force une nouvelle lecture de `process.env`. */
export function resetEnvCache() {
  cached = undefined;
}
