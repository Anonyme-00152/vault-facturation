import "server-only";

import { addMonths } from "@/lib/dates";

import { audit, type AuditActor } from "./audit";
import { anonymizeClient } from "./clients/service";
import { db } from "./db";
import { getSettings } from "./settings";

/**
 * Limitation de la conservation (article 5 du RGPD) : un client sans activité
 * depuis la durée choisie, et sans facture impayée, est anonymisé. Ses factures
 * émises restent conservées 10 ans, durée imposée par le Code de commerce.
 */
export async function retentionCandidates() {
  const settings = await getSettings();
  const threshold = addMonths(new Date(), -settings.clientRetentionMonths);
  const clients = await db.client.findMany({
    where: {
      anonymizedAt: null,
      lastActivityAt: { lt: threshold },
      invoices: { none: { status: { in: ["DRAFT", "SENT"] } } },
    },
    orderBy: { lastActivityAt: "asc" },
    select: { id: true, name: true, type: true, lastActivityAt: true, _count: { select: { invoices: true } } },
  });
  return { settings, threshold, clients };
}

export async function purgeInactiveClients(actor: AuditActor) {
  const { clients, settings } = await retentionCandidates();
  for (const client of clients) {
    await anonymizeClient(client.id);
  }
  // Factures émises depuis plus de 10 ans : la durée légale est écoulée.
  const expired = await db.invoice.deleteMany({
    where: { number: { not: null }, issueDate: { lt: addMonths(new Date(), -12 * settings.invoiceRetentionYears) } },
  });
  await audit({
    action: "RETENTION_PURGE",
    actor,
    metadata: {
      clients_anonymises: clients.length,
      factures_supprimees: expired.count,
      duree_mois: settings.clientRetentionMonths,
    },
  });
  return { anonymized: clients.length, deletedInvoices: expired.count };
}
