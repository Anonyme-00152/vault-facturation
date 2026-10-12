import type { AuditAction } from "@/generated/prisma/enums";

export const AUDIT_LABELS: Record<AuditAction, string> = {
  LOGIN_SUCCESS: "Connexion réussie",
  LOGIN_FAILURE: "Échec de connexion",
  LOGIN_LOCKED: "Verrouillage temporaire",
  LOGOUT: "Déconnexion",
  SESSION_EXPIRED: "Session expirée",
  MFA_ENROLLED: "Double authentification activée",
  MFA_SUCCESS: "Double authentification validée",
  MFA_FAILURE: "Échec de double authentification",
  MFA_RESET: "Double authentification réinitialisée",
  BACKUP_CODE_USED: "Code de secours utilisé",
  BACKUP_CODES_REGENERATED: "Codes de secours régénérés",
  PASSWORD_CHANGED: "Mot de passe modifié",
  CHARTER_ACCEPTED: "Charte acceptée",
  CHARTER_PUBLISHED: "Charte publiée",
  ACCESS_DENIED: "Accès refusé",
  CLIENT_VIEWED: "Consultation de fiche client",
  CLIENT_CREATED: "Client créé",
  CLIENT_UPDATED: "Client modifié",
  CLIENT_DELETED: "Client supprimé",
  CLIENT_ANONYMIZED: "Client anonymisé",
  CLIENT_EXPORTED: "Export des données d'un client",
  INVOICE_CREATED: "Facture créée",
  INVOICE_UPDATED: "Facture modifiée",
  INVOICE_DELETED: "Brouillon supprimé",
  INVOICE_ISSUED: "Facture émise",
  INVOICE_STATUS_CHANGED: "Statut de facture modifié",
  INVOICE_PDF_EXPORTED: "Export PDF",
  USER_CREATED: "Utilisateur créé",
  USER_UPDATED: "Utilisateur modifié",
  USER_DISABLED: "Utilisateur désactivé",
  USER_ENABLED: "Utilisateur réactivé",
  AUDIT_EXPORTED: "Export du journal",
  AUDIT_VERIFIED: "Vérification d'intégrité",
  RETENTION_PURGE: "Purge de conservation",
  SETTINGS_UPDATED: "Paramètres modifiés",
  DEMO_RESET: "Réinitialisation de la démo",
};

export type AuditTone = "default" | "success" | "danger";

export function auditTone(action: AuditAction): AuditTone {
  if (["LOGIN_FAILURE", "LOGIN_LOCKED", "MFA_FAILURE", "ACCESS_DENIED"].includes(action)) return "danger";
  if (["LOGIN_SUCCESS", "MFA_SUCCESS", "CHARTER_ACCEPTED", "MFA_ENROLLED"].includes(action)) return "success";
  return "default";
}
