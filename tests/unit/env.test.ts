import { afterEach, describe, expect, it } from "vitest";

import { env, resetEnvCache } from "@/env";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
  resetEnvCache();
});

describe("validation de la configuration", () => {
  it("accepte une configuration complète", () => {
    expect(env().ENCRYPTION_KEY_ID).toBe("k1");
  });

  it("refuse une clé de chiffrement trop courte", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => env()).toThrow(/ENCRYPTION_KEY/);
  });

  it("refuse un secret d'authentification trop court", () => {
    process.env.AUTH_SECRET = "court";
    expect(() => env()).toThrow(/AUTH_SECRET/);
  });

  it("n'affiche jamais la valeur d'un secret dans l'erreur", () => {
    process.env.AUTH_SECRET = "valeur-secrete";
    try {
      env();
    } catch (error) {
      expect(String(error)).not.toContain("valeur-secrete");
    }
  });
});
