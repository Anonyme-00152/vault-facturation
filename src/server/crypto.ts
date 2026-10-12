import "server-only";

import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";

import { env } from "@/env";

/**
 * Chiffrement des champs sensibles en AES-256-GCM.
 *
 * Format : `v1:<idClé>:<iv>:<tag>:<chiffré>` (base64url). Chaque valeur a son propre
 * vecteur d'initialisation aléatoire de 96 bits ; le tag d'authentification de 128 bits
 * détecte toute altération. Le « contexte » (ex. `client.email`) est lié au chiffré
 * comme donnée authentifiée : un chiffré copié dans un autre champ ne se déchiffre pas.
 */

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

type Keyring = { currentId: string; keys: Map<string, Buffer> };

let keyring: Keyring | undefined;

function getKeyring(): Keyring {
  if (keyring) return keyring;
  const config = env();
  const keys = new Map<string, Buffer>([[config.ENCRYPTION_KEY_ID, Buffer.from(config.ENCRYPTION_KEY, "base64")]]);
  for (const entry of config.ENCRYPTION_KEYS_PREVIOUS.split(",").filter(Boolean)) {
    const [id, value] = entry.split(":");
    const key = Buffer.from(value ?? "", "base64");
    if (!id || key.length !== 32) throw new Error("ENCRYPTION_KEYS_PREVIOUS mal formée (attendu : id:base64,…)");
    keys.set(id, key);
  }
  keyring = { currentId: config.ENCRYPTION_KEY_ID, keys };
  return keyring;
}

/** Réservé aux tests : relit les clés depuis l'environnement. */
export function resetKeyring() {
  keyring = undefined;
  derived.clear();
}

export function encrypt(plaintext: string, context: string): string {
  const { currentId, keys } = getKeyring();
  const key = keys.get(currentId)!;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, currentId, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decrypt(payload: string, context: string): string {
  const [version, keyId, iv, tag, ciphertext] = payload.split(":");
  if (version !== VERSION || !keyId || !iv || !tag || ciphertext === undefined) {
    throw new Error("Valeur chiffrée invalide");
  }
  const key = getKeyring().keys.get(keyId);
  if (!key) throw new Error(`Clé de chiffrement inconnue : ${keyId}`);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export const encryptNullable = (value: string | null | undefined, context: string) =>
  value ? encrypt(value, context) : null;

export const decryptNullable = (value: string | null | undefined, context: string) =>
  value ? decrypt(value, context) : null;

export const encryptJson = (value: unknown, context: string) => encrypt(JSON.stringify(value), context);

export const decryptJson = <T>(payload: string, context: string): T => JSON.parse(decrypt(payload, context)) as T;

/** Vrai si la valeur a été chiffrée avec une ancienne clé (à rechiffrer lors d'une rotation). */
export function needsReencryption(payload: string): boolean {
  return payload.split(":")[1] !== getKeyring().currentId;
}

/* ── Dérivation de clés et empreintes ─────────────────────── */

const derived = new Map<string, Buffer>();

/** Sous-clé dédiée à un usage, dérivée par HKDF-SHA256 : un secret ne sert jamais à deux choses. */
function deriveKey(secret: string, purpose: string): Buffer {
  const cacheKey = `${purpose}`;
  const cached = derived.get(cacheKey);
  if (cached) return cached;
  const key = Buffer.from(hkdfSync("sha256", secret, "vault-facturation", purpose, 32));
  derived.set(cacheKey, key);
  return key;
}

/**
 * Index aveugle : HMAC-SHA256 de la valeur normalisée. Permet une recherche exacte
 * (« ce client existe-t-il déjà ? ») sans stocker ni déchiffrer l'email.
 */
export function blindIndex(value: string): string {
  const key = deriveKey(env().BLIND_INDEX_KEY, "blind-index:v1");
  return createHmac("sha256", key).update(value.trim().toLowerCase()).digest("hex");
}

/** Empreinte d'un jeton secret (identifiant de session, code de secours) avant stockage. */
export function hashToken(token: string): string {
  const key = deriveKey(env().AUTH_SECRET, "token-hash:v1");
  return createHmac("sha256", key).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Jeton aléatoire encodé en base64url (256 bits par défaut). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
