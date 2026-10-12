import type { NextConfig } from "next";

/**
 * En-têtes de sécurité statiques, appliqués à toutes les réponses.
 * La CSP dépend d'un nonce propre à chaque requête : elle est posée dans `src/proxy.ts`.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Pas de Cache Components : la CSP à nonce impose un rendu dynamique de chaque page,
  // et aucune donnée confidentielle ne doit finir dans un cache partagé.
  serverExternalPackages: ["@node-rs/argon2", "pino", "@react-pdf/renderer"],
  // `forbidden()` : vraie page 403 quand un rôle n'a pas le droit d'accéder à une ressource.
  experimental: { authInterrupts: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
