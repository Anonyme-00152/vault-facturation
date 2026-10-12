import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Registre des traitements",
  description: "Registre des activités de traitement (article 30 du RGPD) de Vault Facturation, à titre de démonstration.",
};

type Processing = {
  id: string;
  title: string;
  rows: [label: string, value: string][];
};

const PROCESSINGS: Processing[] = [
  {
    id: "facturation",
    title: "Gestion de la clientèle et facturation",
    rows: [
      ["Finalité", "Établir, envoyer et suivre les factures ; relancer les impayés."],
      ["Base légale", "Exécution du contrat (art. 6.1 b) et obligation légale (art. 6.1 c)."],
      ["Personnes concernées", "Clients professionnels et particuliers."],
      ["Données", "Identité ou raison sociale, SIRET, TVA, adresse, e-mail et téléphone de facturation, factures."],
      ["Destinataires", "Comptables et administrateurs habilités ; lecteurs en consultation seule."],
      ["Transferts hors UE", "Aucun."],
      ["Durée", "Fiche : 3 ans après la dernière activité, puis anonymisation. Factures : 10 ans."],
      ["Sécurité", "Chiffrement AES-256-GCM par champ, contrôle d'accès par rôle, journalisation des consultations."],
    ],
  },
  {
    id: "acces",
    title: "Sécurité et traçabilité des accès",
    rows: [
      ["Finalité", "Authentifier les utilisateurs, protéger les données, détecter les abus, prouver les accès."],
      ["Base légale", "Intérêt légitime et obligation de sécurité (art. 6.1 f et 32)."],
      ["Personnes concernées", "Utilisateurs de l'application."],
      ["Données", "Identifiant, sessions, adresse IP, navigateur, actions réalisées, acceptations de la charte."],
      ["Destinataires", "Administrateurs."],
      ["Transferts hors UE", "Aucun."],
      ["Durée", "Journal d'audit : 12 mois. Sessions : 12 heures au plus."],
      ["Sécurité", "Journal en ajout seul chaîné par SHA-256, masquage des données sensibles dans les journaux techniques."],
    ],
  },
  {
    id: "comptes",
    title: "Gestion des comptes utilisateurs",
    rows: [
      ["Finalité", "Créer les comptes personnels, attribuer les rôles, gérer la double authentification."],
      ["Base légale", "Intérêt légitime (art. 6.1 f)."],
      ["Personnes concernées", "Collaborateurs."],
      ["Données", "Nom, e-mail professionnel, rôle, empreinte du mot de passe, secret TOTP chiffré, codes de secours hachés."],
      ["Destinataires", "Administrateurs."],
      ["Transferts hors UE", "Aucun."],
      ["Durée", "Durée de la collaboration ; compte désactivé à son terme."],
      ["Sécurité", "Argon2id, 2FA obligatoire, verrouillage temporaire, déconnexion après 15 minutes d'inactivité."],
    ],
  },
];

export default function RegisterPage() {
  return (
    <LegalPage
      eyebrow="RGPD · Article 30"
      title="Registre des traitements"
      updatedAt="12 octobre 2026"
      intro="Version simplifiée, à titre de démonstration. Responsable du traitement : Atelier Lumen SAS (fictive), 12 rue de la Charité, 69002 Lyon."
      sections={PROCESSINGS.map((processing) => ({
        id: processing.id,
        title: processing.title,
        content: (
          <dl className="divide-y divide-border">
            {processing.rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                <dt className="label-mono pt-0.5 text-[0.62rem]">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ),
      }))}
    />
  );
}
