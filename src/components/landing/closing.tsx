import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MaskedLines, Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

const DEMO_ACCOUNTS = [
  { role: "Administrateur", scope: "Utilisateurs, charte, audit, RGPD" },
  { role: "Comptable", scope: "Clients et factures, création et export" },
  { role: "Lecteur", scope: "Consultation seule, sans export" },
];

export function Closing() {
  return (
    <section className="px-3 pb-3 md:px-5 md:pb-5">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-night px-6 py-20 text-white md:px-16 md:py-28 dark:ring-1 dark:ring-white/10">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(45%_60%_at_85%_20%,rgb(142_123_255/0.35),transparent_70%),radial-gradient(35%_45%_at_10%_90%,rgb(210_255_0/0.12),transparent_70%)]"
        />
        <div className="relative grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <MaskedLines
              lines={["Ouvrez", "le coffre."]}
              className="font-display text-[clamp(3.2rem,10vw,10rem)]"
            />
            <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="brand" size="xl">
                <Link href="/connexion">
                  Tester la démo
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link href="/registre-des-traitements">Registre des traitements</Link>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="label-mono mb-4 text-white/50">Trois comptes de démonstration</p>
            <ul className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.03]">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.role} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="font-display text-lg">{account.role}</span>
                  <span className="text-right text-sm text-white/55">{account.scope}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-white/45">Identifiants dans le README. Toutes les données sont fictives.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="overflow-hidden px-5 pt-20 pb-8 md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Gestion des clients et de la facturation, sécurisée et conforme au RGPD. Projet de
              portfolio : toutes les données sont fictives.
            </p>
          </div>
          {[
            {
              title: "Produit",
              links: [
                ["Sécurité", "/#securite"],
                ["Parcours d'accès", "/#parcours"],
                ["Démo", "/connexion"],
              ],
            },
            {
              title: "Confidentialité",
              links: [
                ["Politique de confidentialité", "/confidentialite"],
                ["Registre des traitements", "/registre-des-traitements"],
                ["Mentions légales", "/mentions-legales"],
              ],
            },
            {
              title: "Projet",
              links: [
                ["Code source", "https://github.com/Anonyme-00152"],
                ["Sécurité (SECURITY.md)", "https://github.com/Anonyme-00152"],
              ],
            },
          ].map((column) => (
            <div key={column.title}>
              <p className="label-mono mb-4 text-muted-foreground">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors hover:text-electric"
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p
          aria-hidden
          className="font-display mt-20 -mb-[0.12em] text-center text-[clamp(6rem,30vw,29rem)] leading-none tracking-[-0.07em] text-foreground select-none"
        >
          VAULT
        </p>
        <div className="flex flex-col justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} Ebubekir Arti · Vault Facturation</span>
          <span className="label-mono">Conçu en France · Hébergement UE</span>
        </div>
      </div>
    </footer>
  );
}
