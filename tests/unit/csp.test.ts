import { describe, expect, it } from "vitest";

import { buildCsp, createNonce } from "@/lib/security/csp";

describe("Content-Security-Policy", () => {
  it("n'autorise que les scripts portant le nonce de la requête", () => {
    const csp = buildCsp("abc123", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("interdit l'intégration dans une iframe et les objets", () => {
    const csp = buildCsp("n", false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("n'ajoute unsafe-eval qu'en développement", () => {
    expect(buildCsp("n", true)).toContain("'unsafe-eval'");
    expect(buildCsp("n", true)).not.toContain("upgrade-insecure-requests");
    expect(buildCsp("n", false)).toContain("upgrade-insecure-requests");
  });

  it("génère un nonce différent à chaque appel", () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
    expect(Buffer.from(createNonce(), "base64")).toHaveLength(16);
  });
});
