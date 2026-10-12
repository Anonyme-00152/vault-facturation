import "server-only";

import type { User } from "@/generated/prisma/client";
import { env } from "@/env";

import { decrypt } from "../crypto";
import { currentTotp } from "./totp";

/**
 * Mode démonstration uniquement, comptes de démo uniquement : code TOTP courant
 * et secondes restantes avant le suivant. Renvoie null dans tous les autres cas.
 */
export async function demoTotpHint(user: User): Promise<{ code: string; expiresInSeconds: number } | null> {
  if (!env().DEMO_MODE || !user.isDemo || !user.totpSecretEnc) return null;
  const secret = decrypt(user.totpSecretEnc, `users.totp:${user.id}`);
  return { code: await currentTotp(secret), expiresInSeconds: 30 - (Math.floor(Date.now() / 1000) % 30) };
}
