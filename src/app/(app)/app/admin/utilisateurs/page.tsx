import { ShieldCheck, ShieldOff } from "lucide-react";
import type { Metadata } from "next";

import { CreateUserDialog, RoleSelect, UserRowActions } from "@/components/admin/user-controls";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { env } from "@/env";
import { formatRelative, initials } from "@/lib/format";
import { requireAccess } from "@/server/auth/guard";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const admin = await requireAccess("users:manage");
  const [users, lastLogins] = await Promise.all([
    db.user.findMany({ orderBy: [{ disabledAt: { sort: "asc", nulls: "first" } }, { name: "asc" }] }),
    db.auditLog.groupBy({ by: ["actorId"], where: { action: "LOGIN_SUCCESS" }, _max: { at: true } }),
  ]);
  const lastLoginBy = new Map(lastLogins.map((row) => [row.actorId, row._max.at]));
  const demoMode = env().DEMO_MODE;
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Comptes personnels uniquement. Un nouveau compte reçoit un mot de passe provisoire et doit activer la double authentification à sa première connexion."
        actions={<CreateUserDialog />}
      />
      <section className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="label-mono pl-6 text-[0.62rem]">Utilisateur</TableHead>
              <TableHead className="label-mono text-[0.62rem]">Rôle</TableHead>
              <TableHead className="label-mono hidden text-[0.62rem] md:table-cell">2FA</TableHead>
              <TableHead className="label-mono hidden text-[0.62rem] lg:table-cell">Dernière connexion</TableHead>
              <TableHead className="label-mono pr-6 text-right text-[0.62rem]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const locked = user.id === admin.id || (user.isDemo && demoMode);
              const lastLogin = lastLoginBy.get(user.id);
              return (
                <TableRow key={user.id} className="h-16" data-disabled={Boolean(user.disabledAt) || undefined}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                        {initials(user.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {user.name}
                          {user.id === admin.id && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.email}
                          {user.disabledAt && <span className="ml-2 text-destructive">· désactivé</span>}
                          {user.mustChangePassword && <span className="ml-2 text-electric">· mot de passe provisoire</span>}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleSelect userId={user.id} role={user.role} locked={locked} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.totpEnabledAt ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="size-4 text-electric" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ShieldOff className="size-4" /> À activer
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {lastLogin ? formatRelative(lastLogin, now) : "Jamais"}
                  </TableCell>
                  <TableCell className="pr-6">
                    <UserRowActions userId={user.id} name={user.name} disabled={Boolean(user.disabledAt)} locked={locked} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
      {demoMode && (
        <p className="text-sm text-muted-foreground">
          Mode démonstration : les trois comptes de démo sont protégés pour que chaque visiteur puisse les utiliser. Créez un
          compte pour tester la désactivation, le changement de rôle ou la réinitialisation de la 2FA.
        </p>
      )}
    </div>
  );
}
