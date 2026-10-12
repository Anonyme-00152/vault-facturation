import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";

import { SectionHeading } from "./section-heading";

const RIGHTS = [
  {
    title: "Droit d'accès",
    text: "Export complet du dossier d'un client, au format JSON, en un clic.",
    tag: "Art. 15",
  },
  {
    title: "Droit à l'effacement",
    text: "Anonymisation de la fiche. Les factures restent conservées 10 ans, obligation légale oblige.",
    tag: "Art. 17",
  },
  {
    title: "Limitation de la conservation",
    text: "Durée paramétrable ; les clients inactifs sont purgés ou anonymisés automatiquement.",
    tag: "Art. 5",
  },
  {
    title: "Registre des traitements",
    text: "Finalités, bases légales, durées et mesures de sécurité, consultables en ligne.",
    tag: "Art. 30",
    href: "/registre-des-traitements",
  },
];

export function Gdpr() {
  return (
    <section id="rgpd" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading
          index="04"
          label="RGPD"
          lines={["La conformité,", "dès la conception."]}
          intro="Minimisation des données, durées de conservation, droits des personnes : le règlement est traduit en fonctionnalités, pas en promesses."
        />

        <ul className="mt-16 border-t border-border md:mt-24">
          {RIGHTS.map((right, i) => {
            const content = (
              <>
                <span className="label-mono w-16 shrink-0 pt-2 text-muted-foreground">{right.tag}</span>
                <h3 className="font-display flex-1 text-[clamp(1.6rem,3.2vw,2.8rem)] transition-transform duration-500 ease-(--ease-vault) group-hover:translate-x-2">
                  {right.title}
                </h3>
                <p className="max-w-sm text-muted-foreground md:pt-2">{right.text}</p>
                <span className="hidden size-11 shrink-0 place-items-center rounded-full border border-border transition-all duration-500 ease-(--ease-vault) group-hover:rotate-45 group-hover:border-transparent group-hover:bg-brand group-hover:text-brand-foreground md:grid">
                  <ArrowUpRight className="size-4" />
                </span>
              </>
            );
            const className =
              "group flex flex-col gap-3 border-b border-border py-8 md:flex-row md:items-start md:gap-10 md:py-10";
            return (
              <Reveal key={right.title} delay={i * 0.06}>
                <li>
                  {right.href ? (
                    <Link href={right.href} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <div className={className}>{content}</div>
                  )}
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
