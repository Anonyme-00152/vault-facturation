/**
 * Données de maquette (étape « Design »), entièrement fictives.
 * Elles seront remplacées par des requêtes serveur à l'étape « Tableau de bord ».
 */
import type { InvoiceDisplayStatus } from "@/components/invoices/status-badge";

export const MOCK_KPIS = {
  collectedThisMonth: 4_892_000,
  collectedDelta: 0.124,
  outstanding: 2_134_000,
  outstandingCount: 9,
  overdue: 612_000,
  overdueCount: 3,
  activeClients: 20,
  newClients: 2,
};

export const MOCK_REVENUE = [
  { month: "2025-11", amount: 2_980_000 },
  { month: "2025-12", amount: 3_610_000 },
  { month: "2026-01", amount: 3_240_000 },
  { month: "2026-02", amount: 3_890_000 },
  { month: "2026-03", amount: 3_570_000 },
  { month: "2026-04", amount: 4_120_000 },
  { month: "2026-05", amount: 3_960_000 },
  { month: "2026-06", amount: 4_480_000 },
  { month: "2026-07", amount: 3_720_000 },
  { month: "2026-08", amount: 2_860_000 },
  { month: "2026-09", amount: 4_352_000 },
  { month: "2026-10", amount: 4_892_000 },
];

export const MOCK_INVOICES: {
  id: string;
  number: string;
  client: string;
  issuedAt: string;
  dueAt: string;
  totalCents: number;
  status: InvoiceDisplayStatus;
}[] = [
  { id: "1", number: "FAC-2026-000142", client: "Atelier Nébule", issuedAt: "2026-10-09", dueAt: "2026-11-08", totalCents: 486_000, status: "PAID" },
  { id: "2", number: "FAC-2026-000141", client: "Brasserie du Quai Sud", issuedAt: "2026-10-07", dueAt: "2026-11-06", totalCents: 125_440, status: "SENT" },
  { id: "3", number: "FAC-2026-000140", client: "Cabinet Lysandre", issuedAt: "2026-10-02", dueAt: "2026-11-01", totalCents: 342_000, status: "SENT" },
  { id: "4", number: "FAC-2026-000139", client: "Studio Orbe et Fils", issuedAt: "2026-09-08", dueAt: "2026-10-08", totalCents: 298_000, status: "OVERDUE" },
  { id: "5", number: "FAC-2026-000137", client: "Menuiserie Valcourt", issuedAt: "2026-09-04", dueAt: "2026-10-04", totalCents: 73_680, status: "PAID" },
  { id: "6", number: "—", client: "Pépinière des Glycines", issuedAt: "2026-10-12", dueAt: "2026-11-11", totalCents: 91_200, status: "DRAFT" },
];

export const MOCK_ACCESS: {
  id: string;
  actor: string;
  action: string;
  detail: string;
  at: string;
  tone: "default" | "success" | "danger";
}[] = [
  { id: "a1", actor: "Camille Rousseau", action: "Connexion réussie", detail: "2FA validée · Paris", at: "2026-10-12T09:41:00", tone: "success" },
  { id: "a2", actor: "Camille Rousseau", action: "Consultation de fiche", detail: "Atelier Nébule", at: "2026-10-12T09:38:00", tone: "default" },
  { id: "a3", actor: "Inconnu", action: "Échec de connexion", detail: "Mot de passe invalide · 2e essai", at: "2026-10-12T09:12:00", tone: "danger" },
  { id: "a4", actor: "Hugo Bernard", action: "Export PDF", detail: "FAC-2026-000142", at: "2026-10-12T08:57:00", tone: "default" },
  { id: "a5", actor: "Léa Martin", action: "Charte acceptée", detail: "Version 3", at: "2026-10-12T08:30:00", tone: "success" },
];
