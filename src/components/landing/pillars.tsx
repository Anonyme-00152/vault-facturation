import { Fingerprint, KeyRound, ScrollText } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

import { SectionHeading } from "./section-heading";

const PILLARS = [
  {
    index: "01",
    icon: KeyRound,
    title: "Accès verrouillé",
    text: "Un compte personnel par collaborateur, des mots de passe hachés en Argon2id et une double authentification obligatoire avant toute donnée client.",
    facts: ["TOTP + codes de secours", "Verrouillage après 5 échecs", "Session de 15 min"],
  },
  {
    index: "02",
    icon: Fingerprint,
    title: "Données chiffrées",
    text: "Email, téléphone et adresse sont chiffrés un par un en AES-256-GCM. La clé vit hors de la base : une fuite de la base ne révèle rien.",
    facts: ["Clé hors base", "Rotation des clés", "Recherche par index aveugle"],
  },
  {
    index: "03",
    icon: ScrollText,
    title: "Accès tracé",
    text: "Chaque connexion, consultation, modification ou export est inscrit dans un journal en ajout seul, chaîné par empreintes SHA-256.",
    facts: ["Inaltérable en base", "Intégrité vérifiable", "Export CSV"],
  },
];

export function Pillars() {
  return (
    <section id="securite" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading
          index="01"
          label="Sécurité"
          lines={["Trois verrous.", "Aucun raccourci."]}
          intro="La sécurité n'est pas une option que l'on active : elle est vérifiée côté serveur, sur chaque page, chaque action et chaque export."
        />

        <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.index} delay={i * 0.1}>
              <article className="surface group relative flex h-full flex-col overflow-hidden p-7 transition-transform duration-700 ease-(--ease-vault) hover:-translate-y-1 md:p-9">
                <span
                  aria-hidden
                  className="absolute -top-24 -right-24 size-48 rounded-full bg-brand opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-40"
                />
                <div className="flex items-start justify-between">
                  <span className="font-display text-[4.5rem] text-foreground/10 tabular transition-colors duration-500 group-hover:text-foreground">
                    {pillar.index}
                  </span>
                  <span className="grid size-12 place-items-center rounded-full bg-foreground text-background">
                    <pillar.icon className="size-5" />
                  </span>
                </div>
                <h3 className="font-display mt-10 text-3xl">{pillar.title}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{pillar.text}</p>
                <ul className="mt-auto flex flex-wrap gap-2 pt-8">
                  {pillar.facts.map((fact) => (
                    <li
                      key={fact}
                      className="label-mono rounded-full border border-border px-3 py-1.5 text-[0.62rem] text-muted-foreground"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
