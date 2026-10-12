"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fieldErrors } from "@/lib/validation";
import { audit } from "@/server/audit";
import { latestCharter } from "@/server/auth/access";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";

const charterSchema = z.object({
  title: z.string().trim().min(5, "Titre trop court").max(120),
  content: z.string().trim().min(80, "Le texte doit faire au moins 80 caractères").max(4000),
});

export type CharterState = { error?: string; errors?: Record<string, string> };

/** Publie une nouvelle version : chaque utilisateur devra l'accepter à sa prochaine requête. */
export async function publishCharterAction(_: CharterState, formData: FormData): Promise<CharterState> {
  const admin = await requireAccess("charter:manage");
  const parsed = charterSchema.safeParse({ title: formData.get("title"), content: formData.get("content") });
  if (!parsed.success) return { error: "Certains champs sont à corriger.", errors: fieldErrors(parsed.error) };

  const latest = await latestCharter();
  if (latest && latest.title === parsed.data.title && latest.content === parsed.data.content) {
    return { error: "Le texte est identique à la version en vigueur." };
  }
  const version = await db.charterVersion.create({
    data: { ...parsed.data, version: (latest?.version ?? 0) + 1, publishedById: admin.id },
  });
  await audit({
    action: "CHARTER_PUBLISHED",
    actor: actorOf(admin),
    entityType: "charter",
    entityId: version.id,
    metadata: { version: version.version },
  });
  // L'administrateur est lui aussi soumis à la nouvelle version.
  redirect("/charte");
}
