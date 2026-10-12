import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id avec les paramètres recommandés par l'OWASP (19 Mio, 2 itérations).
 * Le sel est aléatoire et intégré au hash produit.
 */
const OPTIONS = { algorithm: 2 /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Hash factice vérifié quand l'email est inconnu : le temps de réponse est le même
 * que pour un compte existant, ce qui empêche de deviner les adresses valides.
 */
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("compte-inexistant-0000");
  await verifyPassword(await dummyHash, password);
}
