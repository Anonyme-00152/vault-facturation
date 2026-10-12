import "server-only";

import { loginSchema } from "@/lib/validation";

import { audit } from "../audit";
import { randomToken, hashToken } from "../crypto";
import { db } from "../db";
import { clear, hit, peek, RULES } from "../rate-limit";
import { requestContext } from "../request-context";
import { burnPasswordCheck, verifyPassword } from "./password";

export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export type LoginOutcome =
  | { ok: true; sessionToken: string; userId: string }
  | { ok: false; code: "invalid" | "locked" | "throttled"; retryAfterSeconds?: number };

/** Libellé tronqué de l'adresse saisie, pour le journal des échecs. */
const attemptLabel = (email: string) => email.slice(0, 120);

/**
 * Vérifie des identifiants et ouvre une session (double authentification encore à faire).
 * Protections : limite par IP, verrouillage temporaire par compte et IP, verrouillage
 * du compte en cas d'attaque distribuée, temps de réponse constant pour un email inconnu,
 * message d'erreur identique dans tous les cas d'échec.
 */
export async function authenticate(raw: { email?: unknown; password?: unknown }): Promise<LoginOutcome> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const { email, password } = parsed.data;
  const { ip, userAgent } = await requestContext();
  const ipKey = `login:ip:${ip ?? "inconnue"}`;
  const accountIpKey = `login:fail:${email}:${ip ?? "inconnue"}`;
  const accountKey = `login:fail:${email}`;

  const perIp = await hit(ipKey, RULES.loginPerIp);
  if (perIp.blocked) {
    return { ok: false, code: "throttled", retryAfterSeconds: perIp.retryAfterSeconds };
  }

  const [lockedHere, lockedEverywhere] = await Promise.all([peek(accountIpKey), peek(accountKey)]);
  if (lockedHere.blocked || lockedEverywhere.blocked) {
    await audit({
      action: "LOGIN_LOCKED",
      actor: null,
      metadata: { motif: "tentative pendant le verrouillage", identifiant: attemptLabel(email) },
    });
    return {
      ok: false,
      code: "locked",
      retryAfterSeconds: Math.max(lockedHere.retryAfterSeconds, lockedEverywhere.retryAfterSeconds),
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = user ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);

  if (!user || !passwordOk || user.disabledAt) {
    const [here, everywhere] = await Promise.all([
      hit(accountIpKey, RULES.loginFailuresPerAccountIp),
      hit(accountKey, RULES.loginFailuresPerAccount),
    ]);
    const nowLocked = here.blocked || everywhere.blocked;
    await audit({
      action: nowLocked ? "LOGIN_LOCKED" : "LOGIN_FAILURE",
      actor: user ? { id: user.id, label: user.name } : null,
      entityType: "user",
      entityId: user?.id,
      metadata: {
        motif: !user ? "compte inconnu" : user.disabledAt ? "compte désactivé" : "mot de passe invalide",
        identifiant: user ? null : attemptLabel(email),
        echecs: here.count,
      },
    });
    if (nowLocked) {
      return { ok: false, code: "locked", retryAfterSeconds: Math.max(here.retryAfterSeconds, everywhere.retryAfterSeconds) };
    }
    return { ok: false, code: "invalid" };
  }

  await clear(accountIpKey);
  const sessionToken = randomToken();
  await db.session.create({
    data: {
      id: hashToken(sessionToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
      ip,
      userAgent,
    },
  });
  await audit({
    action: "LOGIN_SUCCESS",
    actor: { id: user.id, label: user.name },
    entityType: "user",
    entityId: user.id,
    metadata: { etape: "mot de passe validé" },
  });
  return { ok: true, sessionToken, userId: user.id };
}
