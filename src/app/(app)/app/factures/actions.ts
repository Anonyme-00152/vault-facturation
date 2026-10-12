"use server";

import { redirect } from "next/navigation";

import { dateFromIso } from "@/lib/dates";
import { fieldErrors, invoiceDraftSchema } from "@/lib/validation";
import { audit } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { DomainError } from "@/server/errors";
import { createDraft, deleteDraft, issueInvoice, markPaid, markUnpaid, updateDraft } from "@/server/invoices/service";

export type InvoiceFormState = { error?: string; errors?: Record<string, string> };

export async function saveDraftAction(_: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const user = await requireAccess("invoices:write");
  const id = String(formData.get("id") ?? "") || null;

  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "Lignes de facture illisibles." };
  }
  const parsed = invoiceDraftSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceDate: formData.get("serviceDate") ?? "",
    dueInDays: formData.get("dueInDays"),
    notes: formData.get("notes") ?? "",
    lines,
  });
  if (!parsed.success) return { error: "Certains champs sont à corriger.", errors: fieldErrors(parsed.error) };

  const data = {
    clientId: parsed.data.clientId,
    serviceDate: parsed.data.serviceDate ? dateFromIso(parsed.data.serviceDate) : undefined,
    paymentTermsDays: parsed.data.dueInDays,
    notes: parsed.data.notes,
    lines: parsed.data.lines.map((line) => ({
      designation: line.designation,
      quantityMilli: line.quantity,
      unitPriceCents: line.unitPrice,
      vatRateBp: line.vatRateBp,
    })),
  };

  let invoiceId: string;
  try {
    if (id) {
      await updateDraft(id, data);
      invoiceId = id;
      await audit({ action: "INVOICE_UPDATED", actor: actorOf(user), entityType: "invoice", entityId: id, metadata: { lignes: data.lines.length } });
    } else {
      const invoice = await createDraft(data, user.id);
      invoiceId = invoice.id;
      await audit({ action: "INVOICE_CREATED", actor: actorOf(user), entityType: "invoice", entityId: invoice.id, metadata: { lignes: data.lines.length } });
    }
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  redirect(`/app/factures/${invoiceId}?enregistre=1`);
}

async function run(action: () => Promise<void>): Promise<{ error?: string }> {
  try {
    await action();
    return {};
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
}

export async function issueInvoiceAction(id: string) {
  const user = await requireAccess("invoices:write");
  let number: string | null = null;
  const result = await run(async () => {
    const invoice = await issueInvoice(id);
    number = invoice.number;
    await audit({ action: "INVOICE_ISSUED", actor: actorOf(user), entityType: "invoice", entityId: id, metadata: { numero: invoice.number } });
  });
  if (result.error) return result;
  redirect(`/app/factures/${id}?emise=${number}`);
}

export async function markPaidAction(id: string) {
  const user = await requireAccess("invoices:write");
  const result = await run(async () => {
    const invoice = await markPaid(id);
    await audit({ action: "INVOICE_STATUS_CHANGED", actor: actorOf(user), entityType: "invoice", entityId: id, metadata: { numero: invoice.number, de: "Envoyée", vers: "Payée" } });
  });
  if (result.error) return result;
  redirect(`/app/factures/${id}`);
}

export async function markUnpaidAction(id: string) {
  const user = await requireAccess("invoices:write");
  const result = await run(async () => {
    const invoice = await markUnpaid(id);
    await audit({ action: "INVOICE_STATUS_CHANGED", actor: actorOf(user), entityType: "invoice", entityId: id, metadata: { numero: invoice.number, de: "Payée", vers: "Envoyée" } });
  });
  if (result.error) return result;
  redirect(`/app/factures/${id}`);
}

export async function deleteDraftAction(id: string) {
  const user = await requireAccess("invoices:write");
  const result = await run(async () => {
    await deleteDraft(id);
    await audit({ action: "INVOICE_DELETED", actor: actorOf(user), entityType: "invoice", entityId: id });
  });
  if (result.error) return result;
  redirect("/app/factures?statut=brouillons");
}
