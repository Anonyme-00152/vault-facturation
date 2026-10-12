import { describe, expect, it } from "vitest";

import { createRandom, fakeIban, fakeSiren, fakeSiret } from "@/server/demo/fixtures";
import {
  clientSchema,
  frenchVatNumber,
  invoiceDraftSchema,
  isValidSiret,
  luhnValid,
  normalizeFrenchPhone,
  passwordIssues,
} from "@/lib/validation";

describe("SIRET et TVA", () => {
  it("valide la clé de Luhn", () => {
    expect(luhnValid("000427310")).toBe(true);
    expect(luhnValid("000427311")).toBe(false);
    expect(isValidSiret("000 427 310 00016")).toBe(true);
    expect(isValidSiret("00042731000017")).toBe(false);
    expect(isValidSiret("1234")).toBe(false);
  });

  it("calcule le numéro de TVA intracommunautaire", () => {
    expect(frenchVatNumber("000427310")).toBe("FR87000427310");
  });

  it("génère des identifiants fictifs valides", () => {
    const random = createRandom(1);
    for (let i = 0; i < 20; i++) {
      const siren = fakeSiren(random);
      expect(siren.startsWith("000")).toBe(true);
      expect(luhnValid(siren)).toBe(true);
      expect(isValidSiret(fakeSiret(random, siren))).toBe(true);
    }
  });

  it("génère des IBAN fictifs à clé valide", () => {
    const iban = fakeIban(createRandom(7)).replace(/\s/g, "");
    const rearranged = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (l) => String(l.charCodeAt(0) - 55));
    expect([...rearranged].reduce((acc, d) => (acc * 10 + Number(d)) % 97, 0)).toBe(1);
  });
});

describe("téléphone", () => {
  it("normalise les formats français", () => {
    expect(normalizeFrenchPhone("0639980012")).toBe("06 39 98 00 12");
    expect(normalizeFrenchPhone("+33 6 39 98 00 12")).toBe("06 39 98 00 12");
    expect(normalizeFrenchPhone("01.99.00.12.34")).toBe("01 99 00 12 34");
    expect(normalizeFrenchPhone("12345")).toBeNull();
  });
});

describe("politique de mot de passe", () => {
  it("exige 12 caractères au minimum", () => {
    expect(passwordIssues("Court1!")).toContain("Au moins 12 caractères.");
    expect(passwordIssues("une phrase de passe solide")).toEqual([]);
  });

  it("refuse les mots de passe courants ou trop répétitifs", () => {
    expect(passwordIssues("motdepasse123")).toContain("Ce mot de passe est trop courant.");
    expect(passwordIssues("aaaaaaaaaaaaaaa")).toContain("Variez davantage les caractères.");
  });

  it("refuse un mot de passe contenant l'email ou le nom", () => {
    expect(passwordIssues("camille-2026-secret", { email: "camille@vault.test" })).toContain(
      "Ne réutilisez pas votre adresse e-mail.",
    );
    expect(passwordIssues("rousseau-2026-secret", { name: "Camille Rousseau" })).toContain(
      "Ne réutilisez pas votre nom.",
    );
  });
});

describe("schéma client", () => {
  const base = {
    type: "ENTREPRISE",
    name: "Atelier Nébule SAS",
    siret: "000 427 310 00016",
    email: "Compta@Nebule.TEST",
    phone: "+33 1 99 00 12 34",
    address: { line1: "12 rue des Tanneurs", postalCode: "69002", city: "Lyon" },
    paymentTermsDays: "30",
  };

  it("normalise les champs", () => {
    const parsed = clientSchema.parse(base);
    expect(parsed.siret).toBe("00042731000016");
    expect(parsed.email).toBe("compta@nebule.test");
    expect(parsed.phone).toBe("01 99 00 12 34");
    expect(parsed.address.country).toBe("France");
    expect(parsed.paymentTermsDays).toBe(30);
  });

  it("exige un SIRET valide pour une entreprise", () => {
    expect(clientSchema.safeParse({ ...base, siret: "" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, siret: "00042731000017" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, type: "PARTICULIER", siret: "" }).success).toBe(true);
  });

  it("plafonne le délai de paiement à 60 jours", () => {
    expect(clientSchema.safeParse({ ...base, paymentTermsDays: "90" }).success).toBe(false);
  });
});

describe("schéma de brouillon de facture", () => {
  it("convertit les lignes saisies en entiers", () => {
    const parsed = invoiceDraftSchema.parse({
      clientId: "0199c5a0-0000-7000-8000-000000000000",
      dueInDays: "30",
      lines: [{ designation: "Développement", quantity: "1,5", unitPrice: "600", vatRateBp: "2000" }],
    });
    expect(parsed.lines[0]).toEqual({
      designation: "Développement",
      quantity: 1500,
      unitPrice: 60_000,
      vatRateBp: 2000,
    });
  });

  it("refuse un taux de TVA inexistant et une facture sans ligne", () => {
    const line = { designation: "Test", quantity: "1", unitPrice: "10", vatRateBp: "1900" };
    const clientId = "0199c5a0-0000-7000-8000-000000000000";
    expect(invoiceDraftSchema.safeParse({ clientId, dueInDays: "30", lines: [line] }).success).toBe(false);
    expect(invoiceDraftSchema.safeParse({ clientId, dueInDays: "30", lines: [] }).success).toBe(false);
  });
});
