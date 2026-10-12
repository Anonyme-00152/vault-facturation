import { Building2, Plus, User, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { FilterPills, SearchField } from "@/components/app/list-controls";
import { PageHeader } from "@/components/app/page-header";
import { Pager } from "@/components/app/pager";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEUR, formatRelative } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireAccess } from "@/server/auth/guard";
import { listClients, parseClientFilters } from "@/server/clients/queries";

export const metadata: Metadata = { title: "Clients" };

const formatSiret = (siret: string) => siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");

export default async function ClientsPage({ searchParams }: PageProps<"/app/clients">) {
  const user = await requireAccess("clients:read");
  const params = await searchParams;
  const filters = parseClientFilters(params);
  const { clients, total, page, pages } = await listClients(filters);
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        eyebrow="Données clients · chiffrées"
        title="Clients"
        description="Email, téléphone et adresse sont chiffrés en base. La recherche par email passe par une empreinte : rien n'est déchiffré pour chercher."
        actions={
          can(user.role, "clients:write") && (
            <Button asChild variant="brand" size="pill">
              <Link href="/app/clients/nouveau">
                <Plus data-icon="inline-start" />
                Nouveau client
              </Link>
            </Button>
          )
        }
      />

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SearchField placeholder="Nom, SIRET ou email exact…" />
          <div className="flex flex-wrap gap-4">
            <FilterPills
              name="type"
              options={[
                { value: undefined, label: "Tous" },
                { value: "ENTREPRISE", label: "Entreprises" },
                { value: "PARTICULIER", label: "Particuliers" },
              ]}
            />
            <FilterPills
              name="statut"
              options={[
                { value: undefined, label: "Tout statut" },
                { value: "en-retard", label: "Impayés en retard" },
                { value: "anonymises", label: "Anonymisés" },
              ]}
            />
          </div>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filters.q || filters.type || filters.status ? "Aucun résultat" : "Aucun client"}
            description={
              filters.q?.includes("@")
                ? "La recherche par email est exacte : vérifiez l'adresse complète."
                : "Modifiez la recherche ou les filtres."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-mono pl-6 text-[0.62rem]">Client</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] lg:table-cell">SIRET</TableHead>
                <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">Ville</TableHead>
                <TableHead className="label-mono hidden text-right text-[0.62rem] sm:table-cell">Factures</TableHead>
                <TableHead className="label-mono text-right text-[0.62rem]">À encaisser</TableHead>
                <TableHead className="label-mono hidden pr-6 text-right text-[0.62rem] xl:table-cell">Activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="relative h-16">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                        {client.type === "ENTREPRISE" ? <Building2 className="size-4" /> : <User className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/app/clients/${client.id}`}
                          prefetch={false}
                          className="block truncate font-medium after:absolute after:inset-0 hover:underline"
                        >
                          {client.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {client.anonymized ? "Anonymisé (RGPD)" : client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                          {client.overdueCount > 0 && (
                            <span className="ml-2 text-status-overdue-foreground">
                              · {client.overdueCount} en retard
                            </span>
                          )}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {client.siret ? formatSiret(client.siret) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{client.city ?? "—"}</TableCell>
                  <TableCell className="hidden text-right font-mono tabular sm:table-cell">{client.invoiceCount}</TableCell>
                  <TableCell className="text-right font-mono tabular">
                    {client.outstandingCents > 0 ? formatEUR(client.outstandingCents) : "—"}
                  </TableCell>
                  <TableCell className="hidden pr-6 text-right font-mono text-xs text-muted-foreground xl:table-cell">
                    {formatRelative(client.lastActivityAt, now)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-border">
          <Pager page={page} pages={pages} total={total} basePath="/app/clients" params={params} unit={["client", "clients"]} />
        </div>
      </section>
    </div>
  );
}
