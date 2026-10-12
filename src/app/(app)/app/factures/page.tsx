import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { FilterPills, SearchField } from "@/components/app/list-controls";
import { PageHeader } from "@/components/app/page-header";
import { Pager } from "@/components/app/pager";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parisToday } from "@/lib/dates";
import { formatDate, formatEUR } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { can } from "@/lib/permissions";
import { requireAccess } from "@/server/auth/guard";
import { listInvoices, parseInvoiceFilters } from "@/server/invoices/queries";

export const metadata: Metadata = { title: "Factures" };

export default async function InvoicesPage({ searchParams }: PageProps<"/app/factures">) {
  const user = await requireAccess("invoices:read");
  const params = await searchParams;
  const filters = parseInvoiceFilters(params);
  const result = await listInvoices(filters);
  const today = parisToday();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        eyebrow="Facturation"
        title="Factures"
        description="Numérotation continue et sans trou, attribuée à l'émission. Une facture émise ne peut plus être modifiée ni supprimée."
        actions={
          can(user.role, "invoices:write") && (
            <Button asChild variant="brand" size="pill">
              <Link href="/app/factures/nouvelle">
                <Plus data-icon="inline-start" />
                Nouvelle facture
              </Link>
            </Button>
          )
        }
      />

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SearchField placeholder="Numéro ou client…" />
          <FilterPills
            name="statut"
            options={[
              { value: undefined, label: "Toutes" },
              { value: "brouillons", label: "Brouillons", count: result.counts.brouillons },
              { value: "envoyees", label: "Envoyées", count: result.counts.envoyees },
              { value: "en-retard", label: "En retard", count: result.counts["en-retard"] },
              { value: "payees", label: "Payées", count: result.counts.payees },
            ]}
          />
        </div>

        {result.invoices.length === 0 ? (
          <EmptyState icon={FileText} title="Aucune facture" description="Aucune facture ne correspond à ces critères." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Numéro</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Client</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">Émise le</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">Échéance</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Statut</TableHead>
                <TableHead className="label-mono hidden text-right text-[0.62rem] lg:table-cell">HT</TableHead>
                <TableHead className="label-mono pr-6 text-right text-[0.62rem]">TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.invoices.map((invoice) => (
                <TableRow key={invoice.id} className="relative h-14">
                  <TableCell className="pl-6 font-mono text-xs">
                    <Link href={`/app/factures/${invoice.id}`} prefetch={false} className="after:absolute after:inset-0 hover:underline">
                      {invoice.number ?? <span className="text-muted-foreground">Brouillon</span>}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-56 truncate font-medium">{invoice.client.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={displayStatus(invoice.status, invoice.dueDate, today)} />
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-muted-foreground tabular lg:table-cell">
                    {formatEUR(invoice.totalHtCents)}
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono tabular">{formatEUR(invoice.totalTtcCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex flex-col items-center justify-between border-t border-border sm:flex-row">
          <Pager page={result.page} pages={result.pages} total={result.total} basePath="/app/factures" params={params} unit={["facture", "factures"]} />
          {result.total > 0 && (
            <p className="px-6 pb-4 text-sm text-muted-foreground sm:pb-0">
              Total de la sélection : <span className="font-mono text-foreground">{formatEUR(result.sumTtcCents)}</span> TTC
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
