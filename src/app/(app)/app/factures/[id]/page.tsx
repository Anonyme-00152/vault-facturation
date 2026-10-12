import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormAlert } from "@/components/auth/form-alert";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { parisToday } from "@/lib/dates";
import { formatDate, formatDateTime } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { requireAccess } from "@/server/auth/guard";
import { getInvoice } from "@/server/invoices/queries";

export const metadata: Metadata = { title: "Facture" };

export default async function InvoicePage({ params, searchParams }: PageProps<"/app/factures/[id]">) {
  const user = await requireAccess("invoices:read");
  const { id } = await params;
  const flags = await searchParams;
  const invoice = /^[0-9a-f-]{36}$/.test(id) ? await getInvoice(id) : null;
  if (!invoice) notFound();

  const status = displayStatus(invoice.status, invoice.dueDate, parisToday());
  const timeline = [
    { label: "Brouillon créé", date: invoice.createdAt, detail: invoice.createdBy?.name, done: true },
    { label: "Émise", date: invoice.sentAt, detail: invoice.number ?? undefined, done: Boolean(invoice.number) },
    {
      label: status === "OVERDUE" ? "Échéance dépassée" : "Échéance",
      date: invoice.dueDate,
      detail: undefined,
      done: invoice.status === "PAID" || status === "OVERDUE",
      danger: status === "OVERDUE",
      dateOnly: true,
    },
    { label: "Payée", date: invoice.paidAt, detail: undefined, done: invoice.status === "PAID" },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href="/app/factures">
          <ArrowLeft data-icon="inline-start" />
          Factures
        </Link>
      </Button>

      {flags.emise && <FormAlert tone="info">Facture émise sous le numéro {String(flags.emise)}. Elle est désormais inaltérable.</FormAlert>}
      {flags.enregistre && <FormAlert tone="info">Brouillon enregistré.</FormAlert>}

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="label-mono text-muted-foreground">{invoice.clientView.name}</p>
            <StatusBadge status={status} />
          </div>
          <h1 className="font-display mt-3 text-[clamp(1.9rem,3.6vw,3rem)]">{invoice.number ?? "Brouillon"}</h1>
        </div>
        <InvoiceActions
          id={invoice.id}
          status={invoice.status}
          canWrite={can(user.role, "invoices:write")}
          canExport={can(user.role, "invoices:export")}
          clientAnonymized={invoice.clientAnonymized}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <InvoiceDocument invoice={invoice} />

        <aside className="surface p-6 xl:sticky xl:top-24">
          <h2 className="label-mono text-muted-foreground">Suivi</h2>
          <ol className="mt-5 space-y-5">
            {timeline.map((step) => (
              <li key={step.label} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                    step.done && !step.danger && "border-transparent bg-brand text-brand-foreground",
                    step.danger && "border-transparent bg-status-overdue-foreground text-white",
                    !step.done && "border-border",
                  )}
                >
                  {step.done && <Check className="size-3" strokeWidth={3} />}
                </span>
                <div>
                  <p className={cn("text-sm font-medium", !step.done && "text-muted-foreground")}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.date ? (step.dateOnly ? formatDate(step.date) : formatDateTime(step.date)) : "—"}
                    {step.detail && ` · ${step.detail}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {invoice.number && (
            <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Identités du client et du vendeur figées à l&apos;émission. Conservation obligatoire jusqu&apos;en{" "}
              {(invoice.year ?? 0) + 11}.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
