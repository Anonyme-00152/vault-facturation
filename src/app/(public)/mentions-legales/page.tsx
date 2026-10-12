import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Mentions légales"
      updatedAt="12 octobre 2026"
      intro="Site de démonstration réalisé dans le cadre d'un portfolio de développeur. Aucune activité commerciale n'y est exercée."
      sections={[
        {
          id: "editeur",
          title: "Éditeur",
          content: (
            <p>
              Ebubekir Arti, développeur, à titre personnel. Contact : par le dépôt GitHub du projet (compte{" "}
              <a href="https://github.com/Anonyme-00152" target="_blank" rel="noreferrer">
                Anonyme-00152
              </a>
              ).
            </p>
          ),
        },
        {
          id: "hebergement",
          title: "Hébergement",
          content: (
            <p>
              Application hébergée par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis, avec exécution
              et base de données dans l&apos;Union européenne.
            </p>
          ),
        },
        {
          id: "donnees",
          title: "Données fictives",
          content: (
            <p>
              L&apos;entreprise « Atelier Lumen », ses clients, factures, numéros SIREN, IBAN, adresses e-mail et téléphones sont
              inventés. Les numéros de téléphone appartiennent aux plages réservées à la fiction par l&apos;ARCEP, les adresses
              e-mail au domaine réservé « .test ». Les données de démonstration sont réinitialisées chaque nuit.
            </p>
          ),
        },
        {
          id: "propriete",
          title: "Propriété intellectuelle",
          content: (
            <p>
              Code, textes et visuels du site : © 2026 Ebubekir Arti. Polices Geist et IBM Plex Mono sous licence SIL Open
              Font License. La scène 3D est entièrement générée par le code.
            </p>
          ),
        },
      ]}
    />
  );
}
