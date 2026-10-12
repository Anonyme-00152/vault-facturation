import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { Button } from "@/components/ui/button";
import { toIsoDate } from "@/lib/dates";
import { formatQuantity } from "@/lib/invoice-math";
import { requireAccess } from "@/server/auth/guard";
import { billableClients } from "@/server/clients/queries";
import { db } from "@/server/db";
import { invoiceSuggestions } from "@/server/invoices/suggestions";

export const metadata: Metadata = { title: "Modifier le brouillon" };

export default async function EditInvoicePage({ params }: PageProps<"/app/factures/[id]/modifier">) {
  await requireAccess("invoices:write");
  const { id } = await params;
  const invoice = /^[0-9a-f-]{36}$/.test(id)
    ? await db.invoice.findUnique({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } })
    : null;
  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/app/factures/${id}`);
  const clients = await billableClients();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href={`/app/factures/${id}`}>
          <ArrowLeft data-icon="inline-start" />
          Retour au brouillon
        </Link>
      </Button>
      <PageHeader eyebrow="Brouillon" title="Modifier la facture" />
      <InvoiceEditor
        clients={clients}
        suggestions={invoiceSuggestions()}
        initial={{
          id: invoice.id,
          clientId: invoice.clientId,
          serviceDate: invoice.serviceDate ? toIsoDate(invoice.serviceDate) : "",
          dueInDays: String(invoice.paymentTermsDays),
          notes: invoice.notes ?? "",
          lines: invoice.lines.map((line) => ({
            designation: line.designation,
            quantity: formatQuantity(line.quantityMilli),
            unitPrice: (line.unitPriceCents / 100).toFixed(2).replace(".", ","),
            vatRateBp: String(line.vatRateBp),
          })),
        }}
      />
    </div>
  );
}
