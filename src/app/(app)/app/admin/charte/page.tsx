import type { Metadata } from "next";

import { CharterPublisher } from "@/components/admin/charter-publisher";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Charte de confidentialité" };

export default async function CharterAdminPage() {
  await requireAccess("charter:manage");
  const [versions, activeUsers] = await Promise.all([
    db.charterVersion.findMany({
      orderBy: { version: "desc" },
      include: { publishedBy: { select: { name: true } }, _count: { select: { acceptances: true } } },
    }),
    db.user.count({ where: { disabledAt: null } }),
  ]);
  const current = versions[0];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Charte de confidentialité"
        description="Affichée en plein écran après la connexion. L'acceptation est enregistrée avec la date, l'adresse IP, le navigateur et la version."
      />

      {current && (
        <section className="rounded-3xl bg-night p-8 text-white dark:ring-1 dark:ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label-mono text-white/55">
              Version {current.version} en vigueur · publiée le {formatDate(current.publishedAt)}
            </p>
            <p className="label-mono text-brand">
              {current._count.acceptances} / {activeUsers} utilisateurs l&apos;ont acceptée
            </p>
          </div>
          <h2 className="font-display mt-4 text-3xl">{current.title}</h2>
          <p className="mt-4 max-w-3xl border-l-2 border-brand pl-5 leading-relaxed text-white/85">{current.content}</p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, Math.round((current._count.acceptances / Math.max(1, activeUsers)) * 100))}%` }}
            />
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="surface p-6">
          <h2 className="label-mono mb-5 text-muted-foreground">Publier une nouvelle version</h2>
          <CharterPublisher nextVersion={(current?.version ?? 0) + 1} title={current?.title ?? ""} content={current?.content ?? ""} />
        </section>

        <section className="surface overflow-hidden">
          <h2 className="label-mono p-6 pb-2 text-muted-foreground">Historique</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Version</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Publiée le</TableHead>
                <TableHead className="label-mono text-[0.62rem]">Par</TableHead>
                <TableHead className="label-mono pr-6 text-right text-[0.62rem]">Acceptations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version, index) => (
                <TableRow key={version.id} className="h-14">
                  <TableCell className="pl-6">
                    <span className={cn("font-mono", index === 0 && "font-semibold")}>v{version.version}</span>
                    {index === 0 && (
                      <span className="label-mono ml-2 rounded-full bg-brand px-2 py-0.5 text-[0.55rem] text-brand-foreground">
                        En vigueur
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(version.publishedAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{version.publishedBy?.name ?? "—"}</TableCell>
                  <TableCell className="pr-6 text-right font-mono">{version._count.acceptances}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
