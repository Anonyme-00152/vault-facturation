"use server";

import { revalidatePath } from "next/cache";

import { audit } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";
import { purgeInactiveClients } from "@/server/retention";

const ALLOWED_MONTHS = [12, 24, 36, 60];

export async function saveRetentionAction(months: number): Promise<{ error?: string }> {
  const admin = await requireAccess("gdpr:manage");
  if (!ALLOWED_MONTHS.includes(months)) return { error: "Durée non autorisée." };
  const before = await db.settings.findUniqueOrThrow({ where: { id: 1 }, select: { clientRetentionMonths: true } });
  await db.settings.update({ where: { id: 1 }, data: { clientRetentionMonths: months } });
  await audit({
    action: "SETTINGS_UPDATED",
    actor: actorOf(admin),
    metadata: { parametre: "conservation des clients (mois)", de: before.clientRetentionMonths, vers: months },
  });
  revalidatePath("/app/admin/rgpd");
  return {};
}

export async function runPurgeAction(): Promise<{ anonymized: number; deletedInvoices: number }> {
  const admin = await requireAccess("gdpr:manage");
  const result = await purgeInactiveClients(actorOf(admin));
  revalidatePath("/app/admin/rgpd");
  return result;
}
