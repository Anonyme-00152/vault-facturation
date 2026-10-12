import "server-only";

import { cache } from "react";

import { auth } from "@/auth";
import type { User } from "@/generated/prisma/client";

import { audit } from "../audit";
import { hashToken } from "../crypto";
import { db } from "../db";

/** Déconnexion automatique après 15 minutes sans activité (vérifiée côté serveur). */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
/** On ne réécrit `last_seen_at` qu'une fois toutes les 30 s au plus. */
const TOUCH_INTERVAL_MS = 30 * 1000;

export type SessionState = {
  id: string;
  user: User;
  mfaVerified: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  ip: string | null;
  userAgent: string | null;
};

export async function revokeSession(id: string, reason: string) {
  await db.session.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/**
 * Charge et valide une session à partir du jeton du cookie : révocation, expiration
 * absolue (12 h), inactivité (15 min) et compte désactivé sont contrôlés ici.
 */
export async function loadSession(token: string | undefined, options: { touch?: boolean } = {}) {
  if (!token) return null;
  const id = hashToken(token);
  const row = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!row || row.revokedAt) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await revokeSession(id, "expiration");
    return null;
  }
  if (now - row.lastSeenAt.getTime() > IDLE_TIMEOUT_MS) {
    await revokeSession(id, "inactivité");
    await audit({
      action: "SESSION_EXPIRED",
      actor: { id: row.user.id, label: row.user.name },
      entityType: "user",
      entityId: row.user.id,
      metadata: { motif: "15 minutes d'inactivité" },
    });
    return null;
  }
  if (row.user.disabledAt) {
    await revokeSession(id, "compte désactivé");
    return null;
  }

  let lastSeenAt = row.lastSeenAt;
  if (options.touch && now - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    lastSeenAt = new Date(now);
    await db.session.update({ where: { id }, data: { lastSeenAt } });
  }

  return {
    id,
    user: row.user,
    mfaVerified: row.mfaVerifiedAt !== null,
    createdAt: row.createdAt,
    lastSeenAt,
    ip: row.ip,
    userAgent: row.userAgent,
  } satisfies SessionState;
}

/** Session de la requête en cours (mise en cache pour la durée du rendu). */
export const getCurrentSession = cache(async (): Promise<SessionState | null> => {
  const session = await auth();
  return loadSession(session?.sid);
});
