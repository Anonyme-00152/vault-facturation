import { ArrowUpRight, Archive, CalendarClock, FileClock, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PurgeButton, RetentionPicker } from "@/components/admin/retention-controls";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRelative } from "@/lib/format";
import { requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";
import { retentionCandidates } from "@/server/retention";

export const metadata: Metadata = { title: "RGPD et conservation" };

export default async function GdprPage() {
  await requireAccess("gdpr:manage");
  const [{ settings, threshold, clients }, anonymized] = await Promise.all([
    retentionCandidates(),
    db.client.count({ where: { anonymizedAt: { not: null } } }),
  ]);
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        eyebrow="Administration · conformité"
        title="RGPD et conservation"
        description="Les données ne sont gardées que le temps nécessaire. Les factures, elles, doivent légalement être conservées 10 ans : elles survivent à l'anonymisation avec l'identité figée au jour de l'émission."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: CalendarClock, label: "Clients inactifs", value: `${settings.clientRetentionMonths / 12} ans`, hint: "puis anonymisation" },
          { icon: FileClock, label: "Factures émises", value: `${settings.invoiceRetentionYears} ans`, hint: "article L123-22 du Code de commerce" },
          { icon: ScrollText, label: "Journal d'audit", value: `${settings.auditRetentionMonths} mois`, hint: "purge de maintenance, hors application" },
        ].map((item) => (
          <section key={item.label} className="surface flex items-start gap-4 p-6">
            <span className="grid size-10 place-items-center rounded-full bg-muted">
              <item.icon className="size-4" />
            </span>
            <div>
              <p className="label-mono text-muted-foreground">{item.label}</p>
              <p className="font-display mt-2 text-3xl">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
            </div>
          </section>
        ))}
      </div>

      <section className="surface p-6">
        <h2 className="label-mono text-muted-foreground">Durée de conservation des clients inactifs</h2>
        <p className="mt-2 mb-5 max-w-2xl text-sm text-muted-foreground">
          Un client est inactif quand aucune facture ne lui a été émise et que sa fiche n&apos;a pas été modifiée. Les clients ayant
          une facture en brouillon ou impayée ne sont jamais purgés. Une tâche planifiée applique cette règle chaque nuit.
        </p>
        <RetentionPicker months={settings.clientRetentionMonths} />
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pb-3">
          <div>
            <h2 className="label-mono text-muted-foreground">À anonymiser</h2>
            <p className="font-display mt-2 text-2xl">
              {clients.length} client{clients.length > 1 ? "s" : ""} inactif{clients.length > 1 ? "s" : ""} depuis le {formatDate(threshold)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{anonymized} fiche{anonymized > 1 ? "s" : ""} déjà anonymisée{anonymized > 1 ? "s" : ""}.</p>
          </div>
          <PurgeButton count={clients.length} />
        </div>
        {clients.length === 0 ? (
          <EmptyState icon={Archive} title="Rien à purger" description="Aucun client ne dépasse la durée de conservation." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Client</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Dernière activité</TableHead>
                <TableHead className="label-mono pr-6 text-right text-[0.62rem]">Factures conservées</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="relative h-14">
                  <TableCell className="pl-6 font-medium">
                    <Link href={`/app/clients/${client.id}`} prefetch={false} className="after:absolute after:inset-0 hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(client.lastActivityAt)} · {formatRelative(client.lastActivityAt, now)}
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono">{client._count.invoices}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { href: "/registre-des-traitements", title: "Registre des traitements", text: "Finalités, bases légales, destinataires, durées et mesures de sécurité." },
          { href: "/confidentialite", title: "Politique de confidentialité", text: "Information des personnes et exercice de leurs droits." },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="surface group flex items-center justify-between gap-4 p-6 transition-transform hover:-translate-y-0.5">
            <div>
              <p className="font-display text-xl">{link.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{link.text}</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border transition-colors group-hover:border-transparent group-hover:bg-brand group-hover:text-brand-foreground">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
