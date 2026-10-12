import { AlertTriangle, ArrowUpRight, CircleDollarSign, FilePlus2, Hourglass, Plus, Users } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_LABELS, auditTone } from "@/lib/audit-labels";
import { formatDate, formatEUR, formatEURCompact, formatMonth, formatPercent, formatRelative, initials } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { requireAccess } from "@/server/auth/guard";
import { getDashboard } from "@/server/dashboard";

const dayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export default async function DashboardPage() {
  const user = await requireAccess("dashboard:read");
  const { today, kpis: k, revenue, recentInvoices, recentAccess } = await getDashboard(user);
  const canWrite = can(user.role, "invoices:write");
  const monthLabel = formatMonth(today).split(" ")[0];
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="label-mono text-muted-foreground">{dayLabel.format(now)}</p>
          <h1 className="font-display mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">Bonjour, {user.name.split(" ")[0]}.</h1>
          <p className="mt-3 text-muted-foreground">
            {k.overdueCount > 0 ? (
              <>
                <span className="font-medium text-status-overdue-foreground">
                  {k.overdueCount} facture{k.overdueCount > 1 ? "s" : ""} en retard
                </span>{" "}
                {k.overdueCount > 1 ? "demandent" : "demande"} votre attention.
              </>
            ) : (
              "Aucune facture en retard. Tout est sous contrôle."
            )}
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="pill" className="rounded-full">
              <Link href="/app/clients/nouveau">
                <Plus data-icon="inline-start" />
                Nouveau client
              </Link>
            </Button>
            <Button asChild variant="brand" size="pill">
              <Link href="/app/factures/nouvelle">
                <FilePlus2 data-icon="inline-start" />
                Nouvelle facture
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          label={`CA facturé · ${monthLabel}`}
          value={formatEURCompact(k.revenueThisMonth)}
          hint={
            k.revenueDelta === null
              ? `${k.invoicesThisMonth} factures émises, hors taxes`
              : `${formatPercent(k.revenueDelta)} par rapport au mois dernier`
          }
          tone={k.revenueDelta !== null && k.revenueDelta >= 0 ? "positive" : "default"}
          icon={CircleDollarSign}
        />
        <KpiCard
          label="À encaisser"
          value={formatEURCompact(k.outstanding)}
          hint={`${k.outstandingCount} facture${k.outstandingCount > 1 ? "s" : ""} envoyée${k.outstandingCount > 1 ? "s" : ""}, TTC`}
          icon={Hourglass}
        />
        <KpiCard
          label="En retard"
          value={formatEURCompact(k.overdue)}
          hint={`${k.overdueCount} facture${k.overdueCount > 1 ? "s" : ""} · échéance dépassée`}
          tone={k.overdueCount > 0 ? "danger" : "default"}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Clients actifs"
          value={String(k.activeClients)}
          hint={k.newClients > 0 ? `+${k.newClients} ce mois-ci` : "Aucun nouveau ce mois-ci"}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="label-mono text-muted-foreground">Chiffre d&apos;affaires facturé (HT)</h2>
              <p className="font-display mt-2 text-2xl">12 derniers mois</p>
            </div>
            <span className="label-mono flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full bg-brand ring-1 ring-foreground/20" /> Mois en cours
            </span>
          </div>
          <div className="mt-6">
            <RevenueChart data={revenue} />
          </div>
        </section>

        <section className="surface flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h2 className="label-mono text-muted-foreground">
              {user.role === "ADMIN" ? "Derniers accès" : "Vos derniers accès"}
            </h2>
            {user.role === "ADMIN" && (
              <Link href="/app/admin/audit" className="text-xs text-muted-foreground hover:text-foreground">
                Journal complet
              </Link>
            )}
          </div>
          <ol className="mt-5 flex flex-col">
            {recentAccess.length === 0 && <li className="py-6 text-sm text-muted-foreground">Aucun accès enregistré.</li>}
            {recentAccess.map((entry) => {
              const tone = auditTone(entry.action);
              return (
                <li key={String(entry.id)} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold",
                      tone === "danger" ? "bg-status-overdue text-status-overdue-foreground" : "bg-muted",
                    )}
                  >
                    {entry.actorLabel ? initials(entry.actorLabel) : "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{AUDIT_LABELS[entry.action]}</span>
                    <span className="block truncate text-xs text-muted-foreground">{entry.actorLabel ?? "Inconnu"}</span>
                  </span>
                  <time dateTime={entry.at.toISOString()} className="shrink-0 font-mono text-[0.68rem] text-muted-foreground">
                    {formatRelative(entry.at, now)}
                  </time>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="label-mono text-muted-foreground">Factures récentes</h2>
            <p className="font-display mt-2 text-2xl">Dernière activité</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/app/factures">
              Toutes les factures
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="label-mono pl-6 text-[0.62rem]">Numéro</TableHead>
              <TableHead className="label-mono text-[0.62rem]">Client</TableHead>
              <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">Émise le</TableHead>
              <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">Échéance</TableHead>
              <TableHead className="label-mono text-[0.62rem]">Statut</TableHead>
              <TableHead className="label-mono pr-6 text-right text-[0.62rem]">Montant TTC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="relative h-14">
                <TableCell className="pl-6 font-mono text-xs">
                  <Link href={`/app/factures/${invoice.id}`} className="after:absolute after:inset-0">
                    {invoice.number ?? "Brouillon"}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{invoice.client.name}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={displayStatus(invoice.status, invoice.dueDate, today)} />
                </TableCell>
                <TableCell className="pr-6 text-right font-mono tabular">{formatEUR(invoice.totalTtcCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
