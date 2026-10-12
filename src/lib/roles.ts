export const ROLES = ["ADMIN", "COMPTABLE", "LECTEUR"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  COMPTABLE: "Comptable",
  LECTEUR: "Lecteur",
};
