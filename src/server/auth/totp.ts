import "server-only";

import { randomInt } from "node:crypto";

import { generate, generateSecret, generateURI, verify } from "otplib";

/**
 * Double authentification TOTP (RFC 6238), compatible Google Authenticator,
 * Microsoft Authenticator, 1Password, etc. : codes de 6 chiffres, période de 30 s.
 */

export const TOTP_ISSUER = "Vault Facturation";

export const createTotpSecret = () => generateSecret();

export const totpUri = (secret: string, email: string) =>
  generateURI({ issuer: TOTP_ISSUER, label: email, secret });

/**
 * Vérifie un code en tolérant un décalage d'horloge de 30 s, et refuse tout pas de
 * temps déjà utilisé (`afterTimeStep`) : un code intercepté ne peut pas être rejoué.
 */
export async function verifyTotp(
  secret: string,
  token: string,
  lastStep: number | null,
): Promise<{ valid: true; step: number } | { valid: false }> {
  try {
    const result = await verify({
      secret,
      token,
      epochTolerance: 30,
      ...(lastStep != null ? { afterTimeStep: lastStep } : {}),
    });
    if (!result.valid || !("timeStep" in result)) return { valid: false };
    return { valid: true, step: Number(result.timeStep) };
  } catch {
    return { valid: false };
  }
}

/** Code courant : utilisé uniquement par l'aide du mode démonstration. */
export const currentTotp = (secret: string) => generate({ secret });

/* ── Codes de secours ─────────────────────────────────────── */

// Sans caractères ambigus (0/O, 1/I/L) : faciles à recopier depuis un papier.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 10 codes de 10 caractères (≈ 49 bits chacun), affichés une seule fois. */
export function createBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""),
  );
}

/** « ABCDE12345 » → « ABCDE-12345 » */
export const formatBackupCode = (code: string) => `${code.slice(0, 5)}-${code.slice(5)}`;
