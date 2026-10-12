import type { Role } from "./roles";

/**
 * Matrice des droits (RBAC). Elle est vérifiée côté serveur sur chaque page,
 * action et route d'API ; l'interface ne s'en sert que pour masquer des boutons.
 */
export const PERMISSIONS = {
  "dashboard:read": ["ADMIN", "COMPTABLE", "LECTEUR"],
  "clients:read": ["ADMIN", "COMPTABLE", "LECTEUR"],
  "clients:write": ["COMPTABLE"],
  "invoices:read": ["ADMIN", "COMPTABLE", "LECTEUR"],
  "invoices:write": ["COMPTABLE"],
  "invoices:export": ["ADMIN", "COMPTABLE"],
  "users:manage": ["ADMIN"],
  "charter:manage": ["ADMIN"],
  "audit:read": ["ADMIN"],
  "gdpr:manage": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard:read": "Consulter le tableau de bord",
  "clients:read": "Consulter les clients",
  "clients:write": "Créer et modifier les clients",
  "invoices:read": "Consulter les factures",
  "invoices:write": "Créer, émettre et encaisser les factures",
  "invoices:export": "Exporter les factures en PDF",
  "users:manage": "Gérer les utilisateurs et les rôles",
  "charter:manage": "Publier une nouvelle charte",
  "audit:read": "Consulter et exporter le journal d'audit",
  "gdpr:manage": "Exercer les droits RGPD et la conservation",
};
