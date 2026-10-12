import { CheckCircle2, Laptop, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { RegenerateBackupCodes, RevokeOtherSessions } from "@/components/account/security-actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordForm } from "@/components/auth/password-form";
import { PageHeader } from "@/components/app/page-header";
import { env } from "@/env";
import { formatDate, formatDateTime, formatRelative, initials } from "@/lib/format";
import { PERMISSION_LABELS, PERMISSIONS, type Permission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { requireAccess } from "@/server/auth/guard";
import { IDLE_TIMEOUT_MS } from "@/server/auth/session";
import { db } from "@/server/db";
import { describeUserAgent, maskIp } from "@/server/request-context";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireAccess();
  const now = new Date();
  const [record, remainingCodes, sessions, acceptance] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id } }),
    db.backupCode.count({ where: { userId: user.id, usedAt: null } }),
    db.session.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: now },
        lastSeenAt: { gt: new Date(now.getTime() - IDLE_TIMEOUT_MS) },
      },
      orderBy: { lastSeenAt: "desc" },
    }),
    db.charterAcceptance.findFirst({
      where: { userId: user.id },
      orderBy: { acceptedAt: "desc" },
      include: { version: { select: { version: true } } },
    }),
  ]);
  const permissions = (Object.keys(PERMISSIONS) as Permission[]).filter((permission) =>
    (PERMISSIONS[permission] as readonly string[]).includes(user.role),
  );
  const demoLocked = user.isDemo && env().DEMO_MODE;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <PageHeader eyebrow="Compte et sécurité" title="Mon compte" />

      <section className="surface flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-foreground text-lg font-semibold text-background">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="label-mono rounded-full bg-foreground px-3 py-1.5 text-background">{ROLE_LABELS[user.role]}</span>
          {user.isDemo && <span className="label-mono rounded-full bg-brand px-3 py-1.5 text-brand-foreground">Démo</span>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="label-mono text-muted-foreground">Double authentification</h2>
          <div className="mt-4 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-electric" />
            <div>
              <p className="font-medium">Activée</p>
              <p className="text-sm text-muted-foreground">
                Depuis le {record.totpEnabledAt ? formatDate(record.totpEnabledAt) : "—"} · application TOTP
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
            <div>
              <p className="text-sm font-medium">Codes de secours</p>
              <p className="text-sm text-muted-foreground">{remainingCodes} sur 10 encore utilisables</p>
            </div>
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} className={cn("h-6 w-1.5 rounded-full", index < remainingCodes ? "bg-brand" : "bg-border")} />
              ))}
            </div>
          </div>
          <div className="mt-5">
            <RegenerateBackupCodes />
          </div>
        </section>

        <section className="surface p-6">
          <h2 className="label-mono text-muted-foreground">Vos droits</h2>
          <ul className="mt-4 space-y-2.5">
            {permissions.map((permission) => (
              <li key={permission} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="size-4 text-electric" />
                {PERMISSION_LABELS[permission]}
              </li>
            ))}
          </ul>
          {acceptance && (
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
              Charte de confidentialité v{acceptance.version.version} acceptée le {formatDateTime(acceptance.acceptedAt)}.
            </p>
          )}
        </section>
      </div>

      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="label-mono text-muted-foreground">Sessions actives</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fermées automatiquement après 15 minutes d&apos;inactivité.</p>
          </div>
          <RevokeOtherSessions count={sessions.length - 1} />
        </div>
        <ul className="mt-4 divide-y divide-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-4 py-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-muted">
                <Laptop className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {describeUserAgent(session.userAgent)}
                  {session.id === user.sessionId && (
                    <span className="label-mono ml-2 rounded-full bg-brand px-2 py-0.5 text-[0.55rem] text-brand-foreground">
                      Cette session
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP {maskIp(session.ip)} · ouverte le {formatDateTime(session.createdAt)}
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{formatRelative(session.lastSeenAt, now)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface p-6">
        <h2 className="label-mono text-muted-foreground">Mot de passe</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Modifié le {formatDate(record.passwordChangedAt)}. Le changer ferme vos autres sessions.
        </p>
        {demoLocked ? (
          <FormAlert tone="info">
            Le mot de passe des comptes de démonstration ne peut pas être modifié : ils sont partagés entre tous les
            visiteurs.
          </FormAlert>
        ) : (
          <div className="max-w-md">
            <PasswordForm mode="account" email={user.email} name={user.name} />
          </div>
        )}
      </section>
    </div>
  );
}
