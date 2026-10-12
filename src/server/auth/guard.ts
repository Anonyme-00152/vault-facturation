import "server-only";

import { forbidden, redirect } from "next/navigation";
import { NextResponse } from "next/server";

import type { Role } from "@/generated/prisma/client";
import { can, type Permission } from "@/lib/permissions";

import { audit, type AuditActor } from "../audit";
import { STAGE_PATHS, stageFor, type Stage } from "./access";
import { getCurrentSession, type SessionState } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isDemo: boolean;
  sessionId: string;
};

const toUser = (session: SessionState): CurrentUser => ({
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
  role: session.user.role,
  isDemo: session.user.isDemo,
  sessionId: session.id,
});

export const actorOf = (user: { id: string; name: string }): AuditActor => ({ id: user.id, label: user.name });

async function deny(user: CurrentUser, permission: Permission) {
  await audit({
    action: "ACCESS_DENIED",
    actor: actorOf(user),
    metadata: { permission, role: user.role },
  });
}

/**
 * Garde des pages et des actions serveur : la session doit avoir franchi toutes les
 * étapes (2FA, charte…) et le rôle doit détenir la permission demandée.
 * Redirige vers l'étape manquante, ou rend la page 403 (journalisée).
 */
export async function requireAccess(permission?: Permission): Promise<CurrentUser> {
  const session = await getCurrentSession();
  const stage = await stageFor(session);
  if (stage !== "granted" || !session) redirect(STAGE_PATHS[stage]);
  const user = toUser(session);
  if (permission && !can(user.role, permission)) {
    await deny(user, permission);
    forbidden();
  }
  return user;
}

/** Garde des pages d'étape (2FA, charte…) : la session doit être exactement à cette étape. */
export async function requireStage(expected: Exclude<Stage, "login" | "granted">): Promise<SessionState> {
  const session = await getCurrentSession();
  const stage = await stageFor(session);
  if (stage !== expected || !session) redirect(STAGE_PATHS[stage]);
  return session;
}

/** Garde des routes d'API : réponses JSON 401 / 403 au lieu de redirections. */
export async function requireApiAccess(
  permission: Permission,
): Promise<{ user: CurrentUser; response?: never } | { user?: never; response: NextResponse }> {
  const session = await getCurrentSession();
  const stage = await stageFor(session);
  if (stage !== "granted" || !session) {
    return { response: NextResponse.json({ error: "Authentification requise" }, { status: 401 }) };
  }
  const user = toUser(session);
  if (!can(user.role, permission)) {
    await deny(user, permission);
    return { response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { user };
}
