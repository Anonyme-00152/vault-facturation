import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo, VaultMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
      <header>
        <Link href="/" aria-label="Retour à l'accueil">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16">
        <p className="label-mono flex items-center gap-3 text-muted-foreground">
          <span className="text-foreground">Erreur 404</span>
          <span className="h-px w-8 bg-current opacity-40" />
          Page introuvable
        </p>

        <div className="mt-8 flex items-center gap-[0.06em] font-display text-[clamp(7rem,26vw,20rem)] leading-[0.8] tabular">
          <span>4</span>
          <VaultMark className="size-[0.78em] shrink-0" />
          <span>4</span>
        </div>

        <h1 className="mt-10 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] text-balance">
          Cette porte ne mène nulle part.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          La page demandée n&apos;existe pas, a été déplacée, ou n&apos;est pas encore construite.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="brand" size="xl">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" />
              Retour à l&apos;accueil
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl" className="rounded-full">
            <Link href="/app">
              Tableau de bord
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
