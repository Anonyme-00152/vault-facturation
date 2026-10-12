"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/app/(auth)/actions";
import { env } from "@/env";
import { passwordIssues } from "@/lib/validation";
import { audit } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createBackupCodes, formatBackupCode } from "@/server/auth/totp";
import { hashToken } from "@/server/crypto";
import { db } from "@/server/db";

const DEMO_LOCKED = "Désactivé sur les comptes de démonstration, partagés entre tous les visiteurs.";

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAccess();
  if (user.isDemo && env().DEMO_MODE) return { error: DEMO_LOCKED };

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (!(await verifyPassword(record.passwordHash, current))) return { error: "Le mot de passe actuel est incorrect." };
  const issues = passwordIssues(next, { email: user.email, name: user.name });
  if (issues.length) return { error: issues.join(" ") };
  if (next !== String(formData.get("confirmation") ?? "")) return { error: "Les deux mots de passe ne correspondent pas." };
  if (await verifyPassword(record.passwordHash, next)) return { error: "Choisissez un mot de passe différent de l'actuel." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), passwordChangedAt: new Date() },
  });
  await db.session.updateMany({
    where: { userId: user.id, id: { not: user.sessionId }, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "changement de mot de passe" },
  });
  await audit({ action: "PASSWORD_CHANGED", actor: actorOf(user), entityType: "user", entityId: user.id });
  revalidatePath("/app/compte");
  return { fields: { ok: "1" } };
}

export async function regenerateBackupCodesAction(): Promise<{ codes?: string[]; error?: string }> {
  const user = await requireAccess();
  const codes = createBackupCodes();
  await db.$transaction([
    db.backupCode.deleteMany({ where: { userId: user.id } }),
    db.backupCode.createMany({ data: codes.map((code) => ({ userId: user.id, codeHash: hashToken(code) })) }),
  ]);
  await audit({ action: "BACKUP_CODES_REGENERATED", actor: actorOf(user), entityType: "user", entityId: user.id });
  revalidatePath("/app/compte");
  return { codes: codes.map(formatBackupCode) };
}

export async function revokeOtherSessionsAction(): Promise<{ count: number }> {
  const user = await requireAccess();
  const result = await db.session.updateMany({
    where: { userId: user.id, id: { not: user.sessionId }, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "fermée depuis une autre session" },
  });
  await audit({
    action: "LOGOUT",
    actor: actorOf(user),
    entityType: "user",
    entityId: user.id,
    metadata: { sessions_fermees: result.count },
  });
  revalidatePath("/app/compte");
  return { count: result.count };
}
