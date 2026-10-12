import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { Button } from "@/components/ui/button";
import { requireAccess } from "@/server/auth/guard";
import { billableClients } from "@/server/clients/queries";
import { invoiceSuggestions } from "@/server/invoices/suggestions";

export const metadata: Metadata = { title: "Nouvelle facture" };

export default async function NewInvoicePage({ searchParams }: PageProps<"/app/factures/nouvelle">) {
  await requireAccess("invoices:write");
  const { client } = await searchParams;
  const clients = await billableClients();
  const preset = clients.find((option) => option.id === client);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href="/app/factures">
          <ArrowLeft data-icon="inline-start" />
          Factures
        </Link>
      </Button>
      <PageHeader eyebrow="Brouillon" title="Nouvelle facture" />
      <InvoiceEditor
        clients={clients}
        suggestions={invoiceSuggestions()}
        initial={{
          clientId: preset?.id ?? "",
          serviceDate: "",
          dueInDays: String(preset?.paymentTermsDays ?? 30),
          notes: "",
          lines: [],
        }}
      />
    </div>
  );
}
