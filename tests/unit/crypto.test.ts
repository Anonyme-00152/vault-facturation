import { afterEach, describe, expect, it } from "vitest";

import { resetEnvCache } from "@/env";
import {
  blindIndex,
  decrypt,
  decryptJson,
  encrypt,
  encryptJson,
  hashToken,
  needsReencryption,
  resetKeyring,
} from "@/server/crypto";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
  resetEnvCache();
  resetKeyring();
});

describe("chiffrement AES-256-GCM des champs", () => {
  it("chiffre puis déchiffre une valeur", () => {
    const payload = encrypt("compta@atelier.test", "clients.email:1");
    expect(payload).toMatch(/^v1:k1:[\w-]+:[\w-]+:[\w-]+$/);
    expect(payload).not.toContain("atelier");
    expect(decrypt(payload, "clients.email:1")).toBe("compta@atelier.test");
  });

  it("produit un chiffré différent à chaque fois (IV aléatoire)", () => {
    expect(encrypt("même valeur", "ctx")).not.toBe(encrypt("même valeur", "ctx"));
  });

  it("refuse un chiffré déplacé vers un autre champ ou un autre client", () => {
    const payload = encrypt("06 39 98 00 00", "clients.phone:client-a");
    expect(() => decrypt(payload, "clients.phone:client-b")).toThrow();
    expect(() => decrypt(payload, "clients.email:client-a")).toThrow();
  });

  it("détecte toute altération du chiffré", () => {
    const payload = encrypt("donnée sensible", "ctx");
    const parts = payload.split(":");
    const tampered = Buffer.from(parts[4]!, "base64url");
    tampered[0] = tampered[0]! ^ 0xff;
    parts[4] = tampered.toString("base64url");
    expect(() => decrypt(parts.join(":"), "ctx")).toThrow();
  });

  it("relit les anciennes données après une rotation de clé", () => {
    const old = encrypt("ancienne valeur", "ctx");
    const oldKey = process.env.ENCRYPTION_KEY!;
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");
    process.env.ENCRYPTION_KEY_ID = "k2";
    process.env.ENCRYPTION_KEYS_PREVIOUS = `k1:${oldKey}`;
    resetEnvCache();
    resetKeyring();

    expect(decrypt(old, "ctx")).toBe("ancienne valeur");
    expect(needsReencryption(old)).toBe(true);
    const fresh = encrypt("nouvelle valeur", "ctx");
    expect(fresh.startsWith("v1:k2:")).toBe(true);
    expect(needsReencryption(fresh)).toBe(false);
  });

  it("refuse une clé inconnue", () => {
    const payload = encrypt("x", "ctx").replace(":k1:", ":zz:");
    expect(() => decrypt(payload, "ctx")).toThrow(/inconnue/);
  });

  it("chiffre des objets JSON", () => {
    const address = { line1: "12 rue des Tanneurs", postalCode: "69002", city: "Lyon" };
    expect(decryptJson(encryptJson(address, "ctx"), "ctx")).toEqual(address);
  });
});

describe("index aveugle et empreintes", () => {
  it("donne la même empreinte quelle que soit la casse", () => {
    expect(blindIndex("Compta@Atelier.TEST ")).toBe(blindIndex("compta@atelier.test"));
    expect(blindIndex("a@b.test")).not.toBe(blindIndex("c@d.test"));
    expect(blindIndex("a@b.test")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("n'utilise pas la même clé pour l'index et les jetons", () => {
    expect(blindIndex("valeur")).not.toBe(hashToken("valeur"));
  });
});
