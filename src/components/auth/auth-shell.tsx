import { Check } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { VaultCanvas } from "@/components/vault/vault-canvas";
import { cn } from "@/lib/utils";

const STEPS = ["Identification", "Double authentification", "Charte de confidentialité"];

/**
 * Écran d'accès en deux panneaux : le formulaire à gauche, le coffre à droite.
 * La roue du coffre tourne d'un cran à chaque étape franchie.
 */
export function AuthShell({
  step,
  eyebrow,
  title,
  description,
  children,
}: {
  /** Étape courante, de 1 à 3. */
  step: 1 | 2 | 3;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Retour à l'accueil">
            <Logo />
          </Link>
          <ThemeToggle compact />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <p className="label-mono mb-5 text-muted-foreground">
            {eyebrow ?? `Étape ${step} sur ${STEPS.length} · ${STEPS[step - 1]}`}
          </p>
          <h1 className="font-display text-[clamp(2.6rem,5vw,3.75rem)]">{title}</h1>
          {description && <p className="mt-4 leading-relaxed text-muted-foreground">{description}</p>}
          <div className="mt-10">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Accès réservé · Toutes les connexions sont enregistrées.</span>
          <Link href="/confidentialite" className="underline-offset-4 hover:underline">
            Politique de confidentialité
          </Link>
        </footer>
      </div>

      <aside className="relative m-3 hidden overflow-hidden rounded-[28px] bg-night text-white lg:block dark:ring-1 dark:ring-white/10">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_55%_at_55%_42%,rgb(110_86_255/0.4),transparent_70%),radial-gradient(35%_40%_at_15%_90%,rgb(26_47_251/0.3),transparent_70%)]"
        />
        <div className="absolute inset-0">
          <VaultCanvas step={step - 1} scale={0.82} />
        </div>

        <ol className="glass absolute inset-x-6 bottom-6 grid grid-cols-3 gap-2 rounded-3xl p-2">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const done = number < step;
            const current = number === step;
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
                  current && "bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium",
                    done && "border-transparent bg-brand text-brand-foreground",
                    current && "border-brand text-brand",
                    !done && !current && "border-white/20 text-white/40",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : number}
                </span>
                <span className={cn("text-xs leading-tight", current ? "text-white" : "text-white/50")}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
