import { AlertTriangle, ArrowUpRight, CircleDollarSign, FilePlus2, Hourglass, Plus, Users } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { MOCK_ACCESS, MOCK_INVOICES, MOCK_KPIS, MOCK_REVENUE } from "@/components/dashboard/mock";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatEUR, formatEURCompact, formatPercent, formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const today = new Date("2026-10-12T10:00:00");
const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function DashboardPage() {
  const k = MOCK_KPIS;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="label-mono text-muted-foreground">{dayLabel.format(today)}</p>
          <h1 className="font-display mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">Bonjour, Camille.</h1>
          <p className="mt-3 text-muted-foreground">
            <span className="font-medium text-status-overdue-foreground">{k.overdueCount} factures en retard</span>{" "}
            demandent votre attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="pill" className="rounded-full">
            <Plus data-icon="inline-start" />
            Nouveau client
          </Button>
          <Button variant="brand" size="pill">
            <FilePlus2 data-icon="inline-start" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          label="Encaissé · octobre"
          value={formatEURCompact(k.collectedThisMonth)}
          hint={`${formatPercent(k.collectedDelta)} par rapport à septembre`}
          tone="positive"
          icon={CircleDollarSign}
        />
        <KpiCard
          label="À encaisser"
          value={formatEURCompact(k.outstanding)}
          hint={`${k.outstandingCount} factures envoyées`}
          icon={Hourglass}
        />
        <KpiCard
          label="En retard"
          value={formatEURCompact(k.overdue)}
          hint={`${k.overdueCount} factures · échéance dépassée`}
          tone="danger"
          icon={AlertTriangle}
        />
        <KpiCard label="Clients actifs" value={String(k.activeClients)} hint={`+${k.newClients} ce mois-ci`} icon={Users} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface p-6 xl:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="label-mono text-muted-foreground">Chiffre d&apos;affaires encaissé</h2>
              <p className="font-display mt-2 text-2xl">12 derniers mois</p>
            </div>
            <span className="label-mono flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full bg-brand ring-1 ring-foreground/20" /> Mois en cours
            </span>
          </div>
          <div className="mt-6">
            <RevenueChart data={MOCK_REVENUE} />
          </div>
        </section>

        <section className="surface flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h2 className="label-mono text-muted-foreground">Derniers accès</h2>
            <Link href="/app/admin/audit" className="text-xs text-muted-foreground hover:text-foreground">
              Journal complet
            </Link>
          </div>
          <ol className="mt-5 flex flex-col">
            {MOCK_ACCESS.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold",
                    entry.tone === "danger" ? "bg-status-overdue text-status-overdue-foreground" : "bg-muted",
                  )}
                >
                  {entry.actor === "Inconnu" ? "?" : initials(entry.actor)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entry.action}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.actor} · {entry.detail}
                  </span>
                </span>
                <time dateTime={entry.at} className="shrink-0 font-mono text-[0.68rem] text-muted-foreground">
                  {formatRelative(new Date(entry.at), today)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="label-mono text-muted-foreground">Factures récentes</h2>
            <p className="font-display mt-2 text-2xl">Dernières émissions</p>
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
            {MOCK_INVOICES.map((invoice) => (
              <TableRow key={invoice.id} className="h-14">
                <TableCell className="pl-6 font-mono text-xs">{invoice.number}</TableCell>
                <TableCell className="font-medium">{invoice.client}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(new Date(invoice.issuedAt))}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(new Date(invoice.dueAt))}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="pr-6 text-right font-mono tabular">{formatEUR(invoice.totalCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
