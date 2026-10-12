"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/env";
import type { Role } from "@/generated/prisma/client";
import { emailSchema, fieldErrors } from "@/lib/validation";
import { audit } from "@/server/audit";
import { actorOf, requireAccess, type CurrentUser } from "@/server/auth/guard";
import { hashPassword } from "@/server/auth/password";
import { randomToken } from "@/server/crypto";
import { db } from "@/server/db";

const roleSchema = z.enum(["ADMIN", "COMPTABLE", "LECTEUR"]);

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(80),
  email: emailSchema,
  role: roleSchema,
});

export type CreateUserState = {
  error?: string;
  errors?: Record<string, string>;
  created?: { name: string; email: string; temporaryPassword: string };
};

/** Mot de passe provisoire de 20 caractères, à changer à la première connexion. */
const temporaryPassword = () => randomToken(15).replace(/[-_]/g, "x").slice(0, 20);

export async function createUserAction(_: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const admin = await requireAccess("users:manage");
  const parsed = newUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Certains champs sont à corriger.", errors: fieldErrors(parsed.error) };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { error: "Un compte existe déjà avec cette adresse.", errors: { email: "Adresse déjà utilisée" } };
  }

  const password = temporaryPassword();
  const user = await db.user.create({
    data: {
      ...parsed.data,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });
  await audit({
    action: "USER_CREATED",
    actor: actorOf(admin),
    entityType: "user",
    entityId: user.id,
    metadata: { role: user.role, compte: user.name },
  });
  revalidatePath("/app/admin/utilisateurs");
  // Affiché une seule fois à l'administrateur, à transmettre par un canal séparé.
  return { created: { name: user.name, email: user.email, temporaryPassword: password } };
}

type Result = { error?: string };

async function loadTarget(admin: CurrentUser, userId: string) {
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Utilisateur introuvable." } as const;
  if (target.id === admin.id) return { error: "Vous ne pouvez pas modifier votre propre compte depuis cette page." } as const;
  if (target.isDemo && env().DEMO_MODE) {
    return { error: "Les comptes de démonstration sont protégés : créez un compte pour tester cette action." } as const;
  }
  return { target } as const;
}

export async function changeRoleAction(userId: string, role: Role): Promise<Result> {
  const admin = await requireAccess("users:manage");
  if (!roleSchema.safeParse(role).success) return { error: "Rôle inconnu." };
  const loaded = await loadTarget(admin, userId);
  if ("error" in loaded) return { error: loaded.error };
  await db.user.update({ where: { id: userId }, data: { role } });
  await audit({
    action: "USER_UPDATED",
    actor: actorOf(admin),
    entityType: "user",
    entityId: userId,
    metadata: { de: loaded.target.role, vers: role },
  });
  revalidatePath("/app/admin/utilisateurs");
  return {};
}

export async function setDisabledAction(userId: string, disabled: boolean): Promise<Result> {
  const admin = await requireAccess("users:manage");
  const loaded = await loadTarget(admin, userId);
  if ("error" in loaded) return { error: loaded.error };
  await db.user.update({ where: { id: userId }, data: { disabledAt: disabled ? new Date() : null } });
  if (disabled) {
    await db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "compte désactivé" },
    });
  }
  await audit({ action: disabled ? "USER_DISABLED" : "USER_ENABLED", actor: actorOf(admin), entityType: "user", entityId: userId });
  revalidatePath("/app/admin/utilisateurs");
  return {};
}

/** Téléphone perdu : la 2FA est réinitialisée, l'utilisateur la réactivera à sa prochaine connexion. */
export async function resetMfaAction(userId: string): Promise<Result> {
  const admin = await requireAccess("users:manage");
  const loaded = await loadTarget(admin, userId);
  if ("error" in loaded) return { error: loaded.error };
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null } }),
    db.backupCode.deleteMany({ where: { userId } }),
    db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "réinitialisation de la double authentification" },
    }),
  ]);
  await audit({ action: "MFA_RESET", actor: actorOf(admin), entityType: "user", entityId: userId });
  revalidatePath("/app/admin/utilisateurs");
  return {};
}
