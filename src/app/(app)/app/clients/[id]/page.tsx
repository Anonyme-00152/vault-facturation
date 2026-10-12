import { ArrowLeft, Building2, Download, FilePlus2, Lock, Pencil, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormAlert } from "@/components/auth/form-alert";
import { EmptyState } from "@/components/app/empty-state";
import { AnonymizeClientButton, DeleteClientButton } from "@/components/clients/client-danger-zone";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parisToday } from "@/lib/dates";
import { formatDate, formatEUR } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { can } from "@/lib/permissions";
import { audit } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { getClient, getClientInvoices } from "@/server/clients/queries";

export const metadata: Metadata = { title: "Fiche client" };

const formatSiret = (siret: string) => siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
const TERMS: Record<number, string> = { 0: "À réception", 15: "15 jours", 30: "30 jours", 45: "45 jours", 60: "60 jours" };

export default async function ClientPage({ params, searchParams }: PageProps<"/app/clients/[id]">) {
  const user = await requireAccess("clients:read");
  const { id } = await params;
  const flags = await searchParams;
  const client = /^[0-9a-f-]{36}$/.test(id) ? await getClient(id) : null;
  if (!client) notFound();

  // Chaque consultation d'une fiche est inscrite au journal d'audit.
  await audit({ action: "CLIENT_VIEWED", actor: actorOf(user), entityType: "client", entityId: client.id });

  const invoices = await getClientInvoices(client.id);
  const today = parisToday();
  const issued = invoices.filter((invoice) => invoice.number).length;
  const outstanding = invoices.filter((invoice) => invoice.status === "SENT").reduce((sum, invoice) => sum + invoice.totalTtcCents, 0);
  const anonymized = client.anonymizedAt !== null;
  const canWrite = can(user.role, "clients:write") && !anonymized;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href="/app/clients">
          <ArrowLeft data-icon="inline-start" />
          Clients
        </Link>
      </Button>

      {flags.enregistre && <FormAlert tone="info">Fiche enregistrée.</FormAlert>}
      {flags.anonymise && <FormAlert tone="info">Client anonymisé. Les factures émises restent conservées.</FormAlert>}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground text-background">
            {client.type === "ENTREPRISE" ? <Building2 className="size-6" /> : <User className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className="label-mono text-muted-foreground">
              {anonymized ? "Anonymisé (RGPD)" : client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
            </p>
            <h1 className="font-display mt-2 text-[clamp(1.9rem,3.4vw,2.8rem)] break-words">{client.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <>
              <Button asChild variant="outline" size="pill" className="rounded-full">
                <Link href={`/app/clients/${client.id}/modifier`}>
                  <Pencil data-icon="inline-start" />
                  Modifier
                </Link>
              </Button>
              <Button asChild variant="brand" size="pill">
                <Link href={`/app/factures/nouvelle?client=${client.id}`}>
                  <FilePlus2 data-icon="inline-start" />
                  Nouvelle facture
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="surface p-6">
          <h2 className="label-mono text-muted-foreground">Identité</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">SIRET</dt>
              <dd className="font-mono">{client.siret ? formatSiret(client.siret) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">TVA intracommunautaire</dt>
              <dd className="font-mono">{client.vatNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Délai de paiement</dt>
              <dd>{TERMS[client.paymentTermsDays] ?? `${client.paymentTermsDays} jours`}</dd>
            </div>
          </dl>
        </section>

        <section className="surface p-6 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="label-mono text-muted-foreground">Coordonnées</h2>
            <span className="label-mono flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
              <Lock className="size-3" /> Déchiffrées pour cet affichage · consultation journalisée
            </span>
          </div>
          {anonymized ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Données personnelles effacées le {formatDate(client.anonymizedAt!)} (droit à l&apos;effacement).
            </p>
          ) : (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="break-all">{client.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-mono">{client.phone ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Adresse de facturation</dt>
                <dd>
                  {client.address ? (
                    <>
                      {client.address.line1}
                      {client.address.line2 && <>, {client.address.line2}</>}
                      <br />
                      {client.address.postalCode} {client.address.city}, {client.address.country}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pb-2">
          <div>
            <h2 className="label-mono text-muted-foreground">Factures</h2>
            <p className="font-display mt-2 text-2xl">
              {issued} émise{issued > 1 ? "s" : ""} · {formatEUR(outstanding)} à encaisser
            </p>
          </div>
        </div>
        {invoices.length === 0 ? (
          <EmptyState icon={FilePlus2} title="Aucune facture" description="Ce client n'a pas encore été facturé." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Numéro</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] sm:table-cell">Émise le</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] sm:table-cell">Échéance</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Statut</TableHead>
                <TableHead className="label-mono pr-6 text-right text-[0.62rem]">TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="relative h-14">
                  <TableCell className="pl-6 font-mono text-xs">
                    <Link href={`/app/factures/${invoice.id}`} prefetch={false} className="after:absolute after:inset-0">
                      {invoice.number ?? "Brouillon"}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={displayStatus(invoice.status, invoice.dueDate, today)} />
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono tabular">{formatEUR(invoice.totalTtcCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {(can(user.role, "gdpr:manage") || (canWrite && invoices.length === 0)) && (
        <section className="surface border border-dashed border-border p-6">
          <h2 className="label-mono text-muted-foreground">Données personnelles</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Droit d&apos;accès : export complet du dossier au format JSON. Droit à l&apos;effacement : anonymisation de la
            fiche, factures conservées pendant la durée légale.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {can(user.role, "gdpr:manage") && (
              <>
                <Button asChild variant="outline" size="pill" className="rounded-full">
                  <a href={`/api/clients/${client.id}/export`} download>
                    <Download data-icon="inline-start" />
                    Exporter les données (JSON)
                  </a>
                </Button>
                {!anonymized && <AnonymizeClientButton id={client.id} name={client.name} invoiceCount={issued} />}
              </>
            )}
            {canWrite && invoices.length === 0 && <DeleteClientButton id={client.id} name={client.name} />}
          </div>
        </section>
      )}
    </div>
  );
}
