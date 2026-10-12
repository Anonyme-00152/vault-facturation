import "server-only";

import { addDays, parisToday } from "@/lib/dates";
import { uuidv7 } from "@/lib/ids";
import { computeTotals, formatInvoiceNumber, lineTotalHt } from "@/lib/invoice-math";

import { decryptClient, toClientSnapshot } from "../clients/service";
import { encryptJson } from "../crypto";
import { db, type Tx } from "../db";
import { DomainError } from "../errors";
import { getSettings, toSellerSnapshot } from "../settings";

export type DraftLine = {
  designation: string;
  quantityMilli: number;
  unitPriceCents: number;
  vatRateBp: number;
};

export type DraftData = {
  clientId: string;
  serviceDate?: Date;
  paymentTermsDays: number;
  notes?: string;
  lines: DraftLine[];
};

export const clientSnapshotContext = (invoiceId: string) => `invoices.client_snapshot:${invoiceId}`;

function linesData(lines: DraftLine[]) {
  return lines.map((line, index) => ({
    position: index + 1,
    designation: line.designation,
    quantityMilli: line.quantityMilli,
    unitPriceCents: line.unitPriceCents,
    vatRateBp: line.vatRateBp,
    totalHtCents: lineTotalHt(line),
  }));
}

function draftFields(data: DraftData, today: Date) {
  const totals = computeTotals(data.lines);
  return {
    clientId: data.clientId,
    serviceDate: data.serviceDate ?? null,
    paymentTermsDays: data.paymentTermsDays,
    dueDate: addDays(today, data.paymentTermsDays),
    notes: data.notes ?? null,
    totalHtCents: totals.totalHtCents,
    totalVatCents: totals.totalVatCents,
    totalTtcCents: totals.totalTtcCents,
  };
}

async function assertActiveClient(tx: Tx, clientId: string) {
  const client = await tx.client.findUnique({ where: { id: clientId }, select: { anonymizedAt: true } });
  if (!client) throw new DomainError("Client introuvable.");
  if (client.anonymizedAt) throw new DomainError("Ce client a été anonymisé : il ne peut plus être facturé.");
}

export async function createDraft(data: DraftData, createdById: string | null, options: { createdAt?: Date } = {}) {
  return db.$transaction(async (tx) => {
    await assertActiveClient(tx, data.clientId);
    return tx.invoice.create({
      data: {
        id: uuidv7(),
        ...draftFields(data, parisToday()),
        ...(options.createdAt ? { createdAt: options.createdAt } : {}),
        createdById,
        lines: { create: linesData(data.lines) },
      },
    });
  });
}

export async function updateDraft(id: string, data: DraftData) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id }, select: { status: true } });
    if (!invoice) throw new DomainError("Facture introuvable.");
    if (invoice.status !== "DRAFT") throw new DomainError("Une facture émise ne peut plus être modifiée.");
    await assertActiveClient(tx, data.clientId);
    await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: { ...draftFields(data, parisToday()), lines: { create: linesData(data.lines) } },
    });
  });
}

export async function deleteDraft(id: string) {
  const invoice = await db.invoice.findUnique({ where: { id }, select: { status: true } });
  if (!invoice) throw new DomainError("Facture introuvable.");
  if (invoice.status !== "DRAFT") throw new DomainError("Une facture émise doit être conservée 10 ans.");
  await db.invoice.delete({ where: { id } });
}

/**
 * Prochain numéro de l'année. L'incrément se fait dans la transaction d'émission :
 * la ligne du compteur reste verrouillée jusqu'à la validation, et un échec annule
 * l'incrément. La suite est donc continue et sans trou, même en accès concurrents.
 */
export async function nextSequence(tx: Tx, year: number): Promise<number> {
  const rows = await tx.$queryRaw<{ last_number: number }[]>`
    INSERT INTO invoice_sequences (year, last_number) VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number`;
  return rows[0]!.last_number;
}

/** Émission : numérotation, figement des identités et passage au statut « Envoyée ». */
export async function issueInvoice(id: string, options: { issueDate?: Date } = {}) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id}::uuid FOR UPDATE`;
    const invoice = await tx.invoice.findUnique({ where: { id }, include: { lines: true, client: true } });
    if (!invoice) throw new DomainError("Facture introuvable.");
    if (invoice.status !== "DRAFT" || invoice.number) throw new DomainError("Cette facture est déjà émise.");
    if (invoice.client.anonymizedAt) throw new DomainError("Ce client a été anonymisé : il ne peut plus être facturé.");
    if (invoice.lines.length === 0) throw new DomainError("Une facture doit contenir au moins une ligne.");

    const issueDate = options.issueDate ?? parisToday();
    const year = issueDate.getUTCFullYear();
    const sequence = await nextSequence(tx, year);
    const totals = computeTotals(invoice.lines);
    const settings = await getSettings(tx);

    // Émission « historique » (données de démonstration) : horodatée au jour d'émission.
    const sentAt = options.issueDate ? new Date(issueDate.getTime() + 9.5 * 3600 * 1000) : new Date();

    // Une facture émise compte comme activité pour la durée de conservation du client.
    if (invoice.client.lastActivityAt < sentAt) {
      await tx.client.update({ where: { id: invoice.clientId }, data: { lastActivityAt: sentAt } });
    }

    return tx.invoice.update({
      where: { id },
      data: {
        number: formatInvoiceNumber(year, sequence),
        year,
        sequence,
        status: "SENT",
        issueDate,
        serviceDate: invoice.serviceDate ?? issueDate,
        dueDate: addDays(issueDate, invoice.paymentTermsDays),
        sentAt,
        totalHtCents: totals.totalHtCents,
        totalVatCents: totals.totalVatCents,
        totalTtcCents: totals.totalTtcCents,
        clientSnapshotEnc: encryptJson(toClientSnapshot(decryptClient(invoice.client)), clientSnapshotContext(id)),
        sellerSnapshot: toSellerSnapshot(settings),
      },
    });
  });
}

export async function markPaid(id: string, paidAt = new Date()) {
  const invoice = await db.invoice.findUnique({ where: { id }, select: { status: true } });
  if (!invoice) throw new DomainError("Facture introuvable.");
  if (invoice.status !== "SENT") throw new DomainError("Seule une facture envoyée peut être marquée payée.");
  return db.invoice.update({ where: { id }, data: { status: "PAID", paidAt } });
}

export async function markUnpaid(id: string) {
  const invoice = await db.invoice.findUnique({ where: { id }, select: { status: true } });
  if (!invoice) throw new DomainError("Facture introuvable.");
  if (invoice.status !== "PAID") throw new DomainError("Cette facture n'est pas marquée payée.");
  return db.invoice.update({ where: { id }, data: { status: "SENT", paidAt: null } });
}
