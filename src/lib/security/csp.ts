/**
 * Content-Security-Policy stricte, construite pour chaque requête.
 *
 * - Scripts : uniquement ceux qui portent le nonce de la requête (`strict-dynamic`
 *   autorise les scripts qu'ils chargent eux-mêmes). Aucun domaine tiers.
 * - Styles : `unsafe-inline` reste nécessaire pour les attributs `style` rendus côté
 *   serveur (Radix, animations). Le risque est faible comparé aux scripts ; c'est
 *   documenté dans SECURITY.md.
 * - `unsafe-eval` n'est ajouté qu'en développement (traces d'erreur de React).
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** Nonce aléatoire de 128 bits, encodé en base64. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
