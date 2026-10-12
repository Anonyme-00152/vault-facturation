import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Données traitées par Vault Facturation, finalités, durées de conservation, sécurité et droits des personnes.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="RGPD · Information des personnes"
      title="Politique de confidentialité"
      updatedAt="12 octobre 2026"
      intro="Vault Facturation est un projet de démonstration : l'entreprise « Atelier Lumen » et toutes les données affichées sont fictives. Cette politique décrit ce que ferait l'application en conditions réelles, telle qu'elle est conçue."
      sections={[
        {
          id: "responsable",
          title: "Responsable du traitement",
          content: (
            <p>
              Atelier Lumen SAS (fictive), 12 rue de la Charité, 69002 Lyon. Délégué à la protection des données :{" "}
              <strong>dpo@atelier-lumen.test</strong> (adresse de démonstration, non distribuée).
            </p>
          ),
        },
        {
          id: "donnees",
          title: "Données traitées",
          content: (
            <dl className="space-y-3">
              <div>
                <dt>Clients</dt>
                <dd>
                  Raison sociale ou nom, SIRET et numéro de TVA, adresse de facturation, e-mail et téléphone de facturation,
                  délai de paiement, historique des factures. Rien d&apos;autre : seuls les champs utiles à la facturation sont
                  collectés.
                </dd>
              </div>
              <div>
                <dt>Utilisateurs de l&apos;application</dt>
                <dd>
                  Nom, adresse e-mail professionnelle, rôle, empreinte du mot de passe (Argon2id), secret de double
                  authentification chiffré, sessions (adresse IP, navigateur), acceptations de la charte et journal des actions.
                </dd>
              </div>
            </dl>
          ),
        },
        {
          id: "finalites",
          title: "Finalités et bases légales",
          content: (
            <ul>
              <li>Établissement et suivi des factures : exécution du contrat et obligation légale (RGPD, art. 6.1 b et c).</li>
              <li>Conservation des pièces comptables : obligation légale (Code de commerce, art. L123-22).</li>
              <li>Sécurité et traçabilité des accès aux données : intérêt légitime et obligation de sécurité (RGPD, art. 6.1 f et 32).</li>
            </ul>
          ),
        },
        {
          id: "durees",
          title: "Durées de conservation",
          content: (
            <ul>
              <li>Fiche client : 3 ans après la dernière activité (durée réglable par l&apos;administrateur), puis anonymisation automatique.</li>
              <li>Factures émises : 10 ans, y compris après anonymisation de la fiche client.</li>
              <li>Journal d&apos;audit : 12 mois.</li>
              <li>Sessions : 12 heures au plus, fermées après 15 minutes d&apos;inactivité.</li>
            </ul>
          ),
        },
        {
          id: "destinataires",
          title: "Destinataires et hébergement",
          content: (
            <p>
              Seuls les collaborateurs habilités y accèdent, selon leur rôle (administrateur, comptable, lecteur), après double
              authentification et acceptation de la charte de confidentialité. Les données sont hébergées dans l&apos;Union
              européenne. Aucune donnée n&apos;est vendue ni transmise à des fins commerciales.
            </p>
          ),
        },
        {
          id: "securite",
          title: "Sécurité",
          content: (
            <ul>
              <li>E-mail, téléphone et adresse chiffrés champ par champ en AES-256-GCM, clé conservée hors de la base.</li>
              <li>Mots de passe hachés en Argon2id, double authentification obligatoire, verrouillage après plusieurs échecs.</li>
              <li>Journal d&apos;audit en ajout seul, chaîné par empreintes SHA-256.</li>
              <li>Connexions chiffrées (HTTPS), en-têtes de sécurité stricts, aucune donnée personnelle dans les journaux techniques.</li>
            </ul>
          ),
        },
        {
          id: "droits",
          title: "Vos droits",
          content: (
            <>
              <p>
                Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
                portabilité. L&apos;effacement porte sur la fiche client ; les factures émises restent conservées pendant la durée
                légale. Pour exercer vos droits, écrivez au délégué à la protection des données.
              </p>
              <p>
                Vous pouvez aussi adresser une réclamation à la CNIL :{" "}
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
                  cnil.fr
                </a>
                . Le détail des traitements figure dans le <Link href="/registre-des-traitements">registre des traitements</Link>.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies et stockage local",
          content: (
            <p>
              Un seul cookie, strictement nécessaire : la session chiffrée, créée à la connexion. Le choix du thème clair ou
              sombre et l&apos;état de la barre latérale sont mémorisés dans votre navigateur. Aucun cookie publicitaire ni de
              mesure d&apos;audience : aucun bandeau de consentement n&apos;est donc nécessaire.
            </p>
          ),
        },
      ]}
    />
  );
}
