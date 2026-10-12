"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { backupCodeSchema, passwordIssues, totpCodeSchema } from "@/lib/validation";
import { audit } from "@/server/audit";
import { latestCharter, nextStagePath } from "@/server/auth/access";
import { actorOf, requireStage } from "@/server/auth/guard";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getCurrentSession, revokeSession } from "@/server/auth/session";
import { createBackupCodes, formatBackupCode, verifyTotp } from "@/server/auth/totp";
import { decrypt, hashToken } from "@/server/crypto";
import { db } from "@/server/db";
import { clear, hit, RULES } from "@/server/rate-limit";
import { requestContext } from "@/server/request-context";

export type FormState = { error?: string; fields?: Record<string, string> };

/* ── 1. Identification ────────────────────────────────────── */

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", { email, password: formData.get("password"), redirect: false });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      const messages: Record<string, string> = {
        locked: "Trop de tentatives infructueuses. L'accès est suspendu pendant 15 minutes.",
        throttled: "Trop de tentatives depuis cette connexion. Réessayez dans quelques minutes.",
      };
      return {
        error: messages[error.code] ?? "Adresse e-mail ou mot de passe incorrect.",
        fields: { email },
      };
    }
    if (error instanceof AuthError) return { error: "Connexion impossible pour le moment.", fields: { email } };
    throw error;
  }
  // Étape suivante : activation de la 2FA au premier accès, sinon saisie du code.
  const account = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { totpEnabledAt: true },
  });
  redirect(account?.totpEnabledAt ? "/connexion/2fa" : "/activation-2fa");
}

/* ── 2. Double authentification ───────────────────────────── */

async function failMfa(sessionId: string, user: { id: string; name: string }, motif: string): Promise<FormState> {
  const state = await hit(`mfa:${sessionId}`, RULES.mfaFailuresPerSession);
  await audit({
    action: "MFA_FAILURE",
    actor: actorOf(user),
    entityType: "user",
    entityId: user.id,
    metadata: { motif, echecs: state.count },
  });
  if (state.blocked) {
    await revokeSession(sessionId, "trop d'échecs de double authentification");
    await signOut({ redirect: false });
    redirect("/connexion?raison=2fa");
  }
  return { error: "Code incorrect ou expiré. Vérifiez l'heure de votre téléphone et réessayez." };
}

async function completeMfa(sessionId: string) {
  await db.session.update({ where: { id: sessionId }, data: { mfaVerifiedAt: new Date() } });
  await clear(`mfa:${sessionId}`);
}

export async function verifyMfaAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStage("mfa");
  const { user } = session;

  if (formData.get("mode") === "backup") {
    const parsed = backupCodeSchema.safeParse(formData.get("code") ?? "");
    if (!parsed.success) return failMfa(session.id, user, "code de secours mal formé");
    const used = await db.backupCode.updateMany({
      where: { userId: user.id, codeHash: hashToken(parsed.data), usedAt: null },
      data: { usedAt: new Date() },
    });
    if (used.count !== 1) return failMfa(session.id, user, "code de secours invalide");
    const remaining = await db.backupCode.count({ where: { userId: user.id, usedAt: null } });
    await audit({
      action: "BACKUP_CODE_USED",
      actor: actorOf(user),
      entityType: "user",
      entityId: user.id,
      metadata: { restants: remaining },
    });
  } else {
    const parsed = totpCodeSchema.safeParse(formData.get("code") ?? "");
    if (!parsed.success || !user.totpSecretEnc) return failMfa(session.id, user, "code mal formé");
    const secret = decrypt(user.totpSecretEnc, `users.totp:${user.id}`);
    const result = await verifyTotp(secret, parsed.data, user.totpLastStep);
    if (!result.valid) return failMfa(session.id, user, "code TOTP invalide ou déjà utilisé");
    await db.user.update({ where: { id: user.id }, data: { totpLastStep: result.step } });
    await audit({ action: "MFA_SUCCESS", actor: actorOf(user), entityType: "user", entityId: user.id });
  }

  await completeMfa(session.id);
  redirect(await nextStagePath(session.id));
}

/* ── 2 bis. Activation de la double authentification ──────── */

export type EnrollState = FormState & { backupCodes?: string[]; next?: string };

export async function enrollMfaAction(_: EnrollState, formData: FormData): Promise<EnrollState> {
  const session = await requireStage("mfa-setup");
  const { user } = session;
  const parsed = totpCodeSchema.safeParse(formData.get("code") ?? "");
  if (!parsed.success || !user.totpSecretEnc) return { error: "Saisissez le code à 6 chiffres affiché par l'application." };

  const secret = decrypt(user.totpSecretEnc, `users.totp:${user.id}`);
  const result = await verifyTotp(secret, parsed.data, null);
  if (!result.valid) {
    await audit({ action: "MFA_FAILURE", actor: actorOf(user), metadata: { motif: "activation : code invalide" } });
    return { error: "Code incorrect. Vérifiez que l'heure de votre téléphone est automatique." };
  }

  const codes = createBackupCodes();
  await db.$transaction([
    db.backupCode.deleteMany({ where: { userId: user.id } }),
    db.backupCode.createMany({ data: codes.map((code) => ({ userId: user.id, codeHash: hashToken(code) })) }),
    db.user.update({ where: { id: user.id }, data: { totpEnabledAt: new Date(), totpLastStep: result.step } }),
    db.session.update({ where: { id: session.id }, data: { mfaVerifiedAt: new Date() } }),
  ]);
  await audit({ action: "MFA_ENROLLED", actor: actorOf(user), entityType: "user", entityId: user.id });
  // Les codes en clair ne sont montrés qu'une fois ; la base n'en garde que l'empreinte.
  return { backupCodes: codes.map(formatBackupCode), next: await nextStagePath(session.id) };
}

/* ── 3. Changement de mot de passe imposé ─────────────────── */

export async function forcedPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStage("password");
  const { user } = session;
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!(await verifyPassword(user.passwordHash, current))) return { error: "Le mot de passe provisoire est incorrect." };
  const issues = passwordIssues(next, { email: user.email, name: user.name });
  if (issues.length) return { error: issues.join(" ") };
  if (next !== confirmation) return { error: "Les deux mots de passe ne correspondent pas." };
  if (await verifyPassword(user.passwordHash, next)) return { error: "Choisissez un mot de passe différent du précédent." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false, passwordChangedAt: new Date() },
  });
  await db.session.updateMany({
    where: { userId: user.id, id: { not: session.id }, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "changement de mot de passe" },
  });
  await audit({ action: "PASSWORD_CHANGED", actor: actorOf(user), entityType: "user", entityId: user.id });
  redirect(await nextStagePath(session.id));
}

/* ── 4. Charte de confidentialité ─────────────────────────── */

export async function acceptCharterAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStage("charter");
  const latest = await latestCharter();
  if (!latest) redirect("/app");
  if (formData.get("accept") !== "on") return { error: "Vous devez lire et accepter la charte pour continuer." };
  if (formData.get("versionId") !== latest.id) {
    return { error: "Une nouvelle version de la charte vient d'être publiée. Relisez-la avant d'accepter." };
  }

  const { ip, userAgent } = await requestContext();
  await db.charterAcceptance.upsert({
    where: { userId_charterVersionId: { userId: session.user.id, charterVersionId: latest.id } },
    create: { userId: session.user.id, charterVersionId: latest.id, ip, userAgent },
    update: {},
  });
  await audit({
    action: "CHARTER_ACCEPTED",
    actor: actorOf(session.user),
    entityType: "charter",
    entityId: latest.id,
    metadata: { version: latest.version },
  });
  redirect("/app");
}

/* ── Déconnexion et maintien de session ───────────────────── */

export async function logoutAction(reason: "deconnexion" | "inactivite" = "deconnexion") {
  const session = await getCurrentSession();
  if (session) {
    await revokeSession(session.id, reason === "inactivite" ? "inactivité" : "déconnexion");
    await audit({
      action: reason === "inactivite" ? "SESSION_EXPIRED" : "LOGOUT",
      actor: actorOf(session.user),
      entityType: "user",
      entityId: session.user.id,
      metadata: reason === "inactivite" ? { motif: "15 minutes d'inactivité" } : undefined,
    });
  }
  await signOut({ redirect: false });
  redirect(`/connexion?raison=${reason}`);
}

/** Appelé par l'interface quand l'utilisateur est actif : repousse l'expiration côté serveur. */
export async function keepAliveAction(): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false };
  await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return { ok: true };
}
