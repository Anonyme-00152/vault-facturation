import { Link2, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuditFilters, ExportCsvButton, VerifyIntegrity } from "@/components/admin/audit-controls";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Pager } from "@/components/app/pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditAction } from "@/generated/prisma/enums";
import { AUDIT_LABELS, auditTone } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listAudit, parseAuditFilters } from "@/server/audit-queries";
import { requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";
import { describeUserAgent } from "@/server/request-context";

export const metadata: Metadata = { title: "Journal d'audit" };

const GROUPS: { group: string; actions: AuditAction[] }[] = [
  { group: "Accès", actions: ["LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGIN_LOCKED", "LOGOUT", "SESSION_EXPIRED", "ACCESS_DENIED"] },
  { group: "Sécurité du compte", actions: ["MFA_ENROLLED", "MFA_SUCCESS", "MFA_FAILURE", "MFA_RESET", "BACKUP_CODE_USED", "BACKUP_CODES_REGENERATED", "PASSWORD_CHANGED"] },
  { group: "Charte", actions: ["CHARTER_ACCEPTED", "CHARTER_PUBLISHED"] },
  { group: "Clients", actions: ["CLIENT_VIEWED", "CLIENT_CREATED", "CLIENT_UPDATED", "CLIENT_DELETED", "CLIENT_ANONYMIZED", "CLIENT_EXPORTED"] },
  { group: "Factures", actions: ["INVOICE_CREATED", "INVOICE_UPDATED", "INVOICE_DELETED", "INVOICE_ISSUED", "INVOICE_STATUS_CHANGED", "INVOICE_PDF_EXPORTED"] },
  { group: "Administration", actions: ["USER_CREATED", "USER_UPDATED", "USER_DISABLED", "USER_ENABLED", "AUDIT_EXPORTED", "AUDIT_VERIFIED", "RETENTION_PURGE", "SETTINGS_UPDATED", "DEMO_RESET"] },
];

function describeMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  return Object.entries(metadata as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key.replace(/_/g, " ")} : ${value}`)
    .join(" · ");
}

function targetHref(type: string | null, id: string | null) {
  if (!type || !id) return null;
  if (type === "client") return `/app/clients/${id}`;
  if (type === "invoice") return `/app/factures/${id}`;
  return null;
}

export default async function AuditPage({ searchParams }: PageProps<"/app/admin/audit">) {
  await requireAccess("audit:read");
  const params = await searchParams;
  const filters = parseAuditFilters(params);
  const [{ entries, total, pages }, users] = await Promise.all([
    listAudit(filters),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        eyebrow="Administration · ajout seul"
        title="Journal d'audit"
        description="Chaque entrée est chaînée à la précédente par une empreinte SHA-256 calculée par PostgreSQL. Aucune modification ni suppression n'est possible depuis l'application, ni même en SQL."
        actions={
          <>
            <ExportCsvButton />
            <VerifyIntegrity />
          </>
        }
      />

      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4 md:p-5">
          <AuditFilters
            users={users}
            actions={GROUPS.map((group) => ({
              group: group.group,
              items: group.actions.map((action) => ({ value: action, label: AUDIT_LABELS[action] })),
            }))}
          />
        </div>
        {entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="Aucune entrée" description="Aucune action ne correspond à ces filtres." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Rang</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Date</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Utilisateur</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Action</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] xl:table-cell">Détails</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] lg:table-cell">Origine</TableHead>
                <TableHead className="label-mono hidden pr-6 text-[0.62rem] md:table-cell">Empreinte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const tone = auditTone(entry.action);
                const href = targetHref(entry.entityType, entry.entityId);
                return (
                  <TableRow key={String(entry.id)} className="h-14 align-middle">
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{String(entry.seq)}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{formatDateTime(entry.at)}</TableCell>
                    <TableCell className="max-w-40 truncate">{entry.actorLabel ?? <span className="text-muted-foreground">Système</span>}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                          tone === "danger" && "bg-status-overdue text-status-overdue-foreground",
                          tone === "success" && "bg-status-paid text-status-paid-foreground",
                          tone === "default" && "bg-muted",
                        )}
                      >
                        {AUDIT_LABELS[entry.action]}
                        {href && (
                          <Link href={href} prefetch={false} aria-label="Voir la cible">
                            <Link2 className="size-3" />
                          </Link>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-72 truncate text-xs text-muted-foreground xl:table-cell" title={describeMetadata(entry.metadata)}>
                      {describeMetadata(entry.metadata) || "—"}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      <span className="block font-mono">{entry.ip ?? "—"}</span>
                      <span className="block">{entry.userAgent ? describeUserAgent(entry.userAgent) : ""}</span>
                    </TableCell>
                    <TableCell className="hidden pr-6 font-mono text-[0.7rem] text-muted-foreground md:table-cell" title={entry.hash}>
                      {entry.hash.slice(0, 10)}…
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-border">
          <Pager page={filters.page} pages={pages} total={total} basePath="/app/admin/audit" params={params} unit={["entrée", "entrées"]} />
        </div>
      </section>
    </div>
  );
}
