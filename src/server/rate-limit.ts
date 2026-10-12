import "server-only";

import { db } from "./db";

export type LimitRule = {
  /** Nombre d'événements qui déclenche le blocage (le 5e échec verrouille si limit = 5). */
  limit: number;
  windowSeconds: number;
  /** Durée du blocage une fois la limite dépassée. */
  blockSeconds: number;
};

export type LimitState = { blocked: boolean; retryAfterSeconds: number; count: number };

/**
 * Compteur à fenêtre fixe stocké en PostgreSQL : l'incrément est atomique
 * (INSERT … ON CONFLICT), donc fiable avec plusieurs instances du serveur.
 */
export async function hit(key: string, rule: LimitRule): Promise<LimitState> {
  const rows = await db.$queryRaw<{ count: number; blocked_until: Date | null }[]>`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${rule.windowSeconds})
                   THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${rule.windowSeconds})
                          THEN now() ELSE rate_limits.window_start END,
      blocked_until = CASE
        WHEN rate_limits.blocked_until > now() THEN rate_limits.blocked_until
        WHEN (CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${rule.windowSeconds})
                   THEN 1 ELSE rate_limits.count + 1 END) >= ${rule.limit}
          THEN now() + make_interval(secs => ${rule.blockSeconds})
        ELSE NULL END
    RETURNING count, blocked_until`;
  return toState(rows[0]);
}

/** État d'un compteur sans l'incrémenter. */
export async function peek(key: string): Promise<LimitState> {
  const rows = await db.$queryRaw<{ count: number; blocked_until: Date | null }[]>`
    SELECT count, blocked_until FROM rate_limits WHERE key = ${key}`;
  return toState(rows[0]);
}

export async function clear(key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { key } });
}

function toState(row: { count: number; blocked_until: Date | null } | undefined): LimitState {
  if (!row) return { blocked: false, retryAfterSeconds: 0, count: 0 };
  const remaining = row.blocked_until ? Math.ceil((row.blocked_until.getTime() - Date.now()) / 1000) : 0;
  return { blocked: remaining > 0, retryAfterSeconds: Math.max(0, remaining), count: row.count };
}

/** Règles appliquées par l'application. */
export const RULES = {
  /** Toutes tentatives de connexion depuis une même IP. */
  loginPerIp: { limit: 30, windowSeconds: 900, blockSeconds: 900 },
  /** Échecs pour un compte depuis une même IP : verrouillage temporaire. */
  loginFailuresPerAccountIp: { limit: 5, windowSeconds: 900, blockSeconds: 900 },
  /** Échecs pour un compte toutes IP confondues (attaque distribuée). */
  loginFailuresPerAccount: { limit: 20, windowSeconds: 3600, blockSeconds: 900 },
  /** Codes de double authentification erronés pour une session. */
  mfaFailuresPerSession: { limit: 5, windowSeconds: 900, blockSeconds: 900 },
  /** Appels aux routes d'API (PDF, exports) par utilisateur. */
  apiPerUser: { limit: 60, windowSeconds: 60, blockSeconds: 60 },
} satisfies Record<string, LimitRule>;
