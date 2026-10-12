import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
      <header>
        <Link href="/app" aria-label="Tableau de bord">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16">
        <p className="label-mono flex items-center gap-3 text-muted-foreground">
          <span className="text-foreground">Erreur 403</span>
          <span className="h-px w-8 bg-current opacity-40" />
          Accès refusé
        </p>
        <div className="mt-8 flex items-center gap-6">
          <span className="font-display text-[clamp(7rem,24vw,18rem)] leading-[0.8] tabular">403</span>
          <span className="grid size-[clamp(4rem,10vw,8rem)] place-items-center rounded-full bg-brand text-brand-foreground">
            <LockKeyhole className="size-1/2" />
          </span>
        </div>
        <h1 className="mt-10 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] text-balance">
          Cette porte reste fermée pour votre rôle.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Votre compte n&apos;a pas la permission nécessaire. La tentative a été enregistrée dans le journal
          d&apos;audit. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez un administrateur.
        </p>
        <div className="mt-10">
          <Button asChild variant="brand" size="xl">
            <Link href="/app">
              <ArrowLeft data-icon="inline-start" />
              Retour au tableau de bord
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
