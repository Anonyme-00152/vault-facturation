import "server-only";

export const DEMO_DOMAIN = "vault-demo.test";

export const DEMO_ACCOUNTS = [
  { email: `admin@${DEMO_DOMAIN}`, name: "Léa Martin", role: "ADMIN" },
  { email: `comptable@${DEMO_DOMAIN}`, name: "Camille Rousseau", role: "COMPTABLE" },
  { email: `lecteur@${DEMO_DOMAIN}`, name: "Hugo Bernard", role: "LECTEUR" },
] as const;

/** Mot de passe des comptes de démonstration (public : il figure dans le README). */
export const demoPassword = () => process.env.DEMO_PASSWORD ?? "Vault-Demo-2026!";
