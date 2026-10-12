import "server-only";

import { db } from "../db";
import type { SessionState } from "./session";

/**
 * Parcours d'accès, dans l'ordre : identification → double authentification
 * (activation au premier accès) → changement de mot de passe éventuel → charte
 * de confidentialité → données. Chaque étape est vérifiée côté serveur.
 */
export type Stage = "login" | "mfa-setup" | "mfa" | "password" | "charter" | "granted";

export const STAGE_PATHS: Record<Stage, string> = {
  login: "/connexion",
  "mfa-setup": "/activation-2fa",
  mfa: "/connexion/2fa",
  password: "/connexion/nouveau-mot-de-passe",
  charter: "/charte",
  granted: "/app",
};

export async function latestCharter() {
  return db.charterVersion.findFirst({ orderBy: { version: "desc" } });
}

export async function hasAcceptedLatestCharter(userId: string): Promise<boolean> {
  const latest = await latestCharter();
  if (!latest) return true;
  const acceptance = await db.charterAcceptance.findUnique({
    where: { userId_charterVersionId: { userId, charterVersionId: latest.id } },
    select: { id: true },
  });
  return acceptance !== null;
}

/** Chemin de l'étape suivante d'une session, relue en base juste après une action. */
export async function nextStagePath(sessionId: string): Promise<string> {
  const row = await db.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!row || row.revokedAt) return STAGE_PATHS.login;
  const stage = await stageFor({
    id: row.id,
    user: row.user,
    mfaVerified: row.mfaVerifiedAt !== null,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    ip: row.ip,
    userAgent: row.userAgent,
  });
  return STAGE_PATHS[stage];
}

export async function stageFor(session: SessionState | null): Promise<Stage> {
  if (!session) return "login";
  if (!session.user.totpEnabledAt) return "mfa-setup";
  if (!session.mfaVerified) return "mfa";
  if (session.user.mustChangePassword) return "password";
  if (!(await hasAcceptedLatestCharter(session.user.id))) return "charter";
  return "granted";
}
