import { Check, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

import { CharterForm } from "@/components/auth/charter-form";
import { LogoutLink } from "@/components/auth/logout-link";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/format";
import { latestCharter } from "@/server/auth/access";
import { requireStage } from "@/server/auth/guard";
import { db } from "@/server/db";
import { maskIp, requestContext } from "@/server/request-context";

export const metadata: Metadata = { title: "Charte de confidentialité" };

export default async function CharterPage() {
  const session = await requireStage("charter");
  const charter = (await latestCharter())!;
  const previous = await db.charterAcceptance.findFirst({
    where: { userId: session.user.id },
    orderBy: { acceptedAt: "desc" },
    include: { version: { select: { version: true } } },
  });
  const { ip } = await requestContext();

  return (
    <div className="dark relative isolate min-h-dvh overflow-hidden bg-night text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_45%_at_85%_0%,rgb(142_123_255/0.28),transparent_70%),radial-gradient(40%_40%_at_0%_100%,rgb(26_47_251/0.22),transparent_70%)]"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <ol className="hidden items-center gap-6 text-xs text-white/50 md:flex" aria-label="Parcours d'accès">
          {["Identification", "Double authentification"].map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {label}
            </li>
          ))}
          <li aria-current="step" className="flex items-center gap-2 text-white">
            <span className="grid size-5 place-items-center rounded-full border border-brand text-[0.65rem] text-brand">3</span>
            Charte de confidentialité
          </li>
        </ol>
        <LogoutLink className="text-white/60 hover:text-white" />
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-10 pb-20 sm:px-10 md:pt-16">
        <p className="label-mono flex flex-wrap items-center gap-3 text-white/55">
          <ShieldAlert className="size-4 text-brand" />
          Version {charter.version} · publiée le {formatDate(charter.publishedAt)}
        </p>
        <h1 className="font-display mt-6 text-[clamp(2.8rem,8vw,6rem)] leading-[0.92]">{charter.title}</h1>

        {previous && previous.version.version < charter.version && (
          <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/70">
            La charte a changé depuis votre dernière acceptation (version {previous.version.version}, le{" "}
            {formatDate(previous.acceptedAt)}). Merci de la relire et de l&apos;accepter à nouveau.
          </p>
        )}

        <blockquote className="mt-10 border-l-2 border-brand pl-6 text-[clamp(1.15rem,2.2vw,1.45rem)] leading-relaxed text-white/90 md:pl-8">
          {charter.content}
        </blockquote>

        <div className="mt-12">
          <CharterForm versionId={charter.id} />
        </div>

        <p className="mt-8 text-sm leading-relaxed text-white/45">
          Votre acceptation est enregistrée avec la date et l&apos;heure, la version de la charte, votre adresse IP (
          {maskIp(ip)}) et votre navigateur. Sans acceptation, aucune donnée client n&apos;est accessible.
        </p>
      </main>
    </div>
  );
}
