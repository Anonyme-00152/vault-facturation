import { describe, expect, it } from "vitest";

import {
  computeTotals,
  formatInvoiceNumber,
  formatQuantity,
  isOverdue,
  lineTotalHt,
  parseEurosToCents,
  parseQuantityToMilli,
  roundDiv,
} from "@/lib/invoice-math";

describe("arrondis", () => {
  it("arrondit la demi-unité vers l'infini", () => {
    expect(roundDiv(5, 10)).toBe(1);
    expect(roundDiv(4, 10)).toBe(0);
    expect(roundDiv(15, 10)).toBe(2);
    expect(roundDiv(-15, 10)).toBe(-2);
  });

  it("refuse un dépassement des entiers sûrs", () => {
    expect(() => roundDiv(Number.MAX_SAFE_INTEGER * 2, 10)).toThrow(RangeError);
  });
});

describe("calcul des lignes", () => {
  it("multiplie quantité et prix unitaire au centime près", () => {
    expect(lineTotalHt({ quantityMilli: 3000, unitPriceCents: 60_000, vatRateBp: 2000 })).toBe(180_000);
    // 1,5 h à 33,33 € = 49,995 € → 50,00 €
    expect(lineTotalHt({ quantityMilli: 1500, unitPriceCents: 3_333, vatRateBp: 2000 })).toBe(5_000);
    // 0,333 × 10,00 € = 3,33 €
    expect(lineTotalHt({ quantityMilli: 333, unitPriceCents: 1_000, vatRateBp: 2000 })).toBe(333);
  });
});

describe("totaux de facture", () => {
  it("calcule HT, TVA et TTC", () => {
    const totals = computeTotals([
      { quantityMilli: 2000, unitPriceCents: 65_000, vatRateBp: 2000 },
      { quantityMilli: 1000, unitPriceCents: 9_500, vatRateBp: 2000 },
    ]);
    expect(totals.totalHtCents).toBe(139_500);
    expect(totals.totalVatCents).toBe(27_900);
    expect(totals.totalTtcCents).toBe(167_400);
  });

  it("récapitule la TVA par taux, du plus élevé au plus bas", () => {
    const totals = computeTotals([
      { quantityMilli: 1000, unitPriceCents: 10_000, vatRateBp: 2000 },
      { quantityMilli: 10_000, unitPriceCents: 2_450, vatRateBp: 1000 },
      { quantityMilli: 1000, unitPriceCents: 5_000, vatRateBp: 2000 },
    ]);
    expect(totals.vatBreakdown).toEqual([
      { vatRateBp: 2000, baseHtCents: 15_000, vatCents: 3_000 },
      { vatRateBp: 1000, baseHtCents: 24_500, vatCents: 2_450 },
    ]);
    expect(totals.totalTtcCents).toBe(totals.totalHtCents + totals.totalVatCents);
  });

  it("calcule la TVA sur la base cumulée du taux, pas ligne par ligne", () => {
    // 3 lignes à 0,05 € à 5,5 % : TVA ligne à ligne = 3 × 0 ; sur la base = 0,15 × 5,5 % = 0,01 €
    const totals = computeTotals(
      Array.from({ length: 3 }, () => ({ quantityMilli: 1000, unitPriceCents: 5, vatRateBp: 550 })),
    );
    expect(totals.totalVatCents).toBe(1);
  });

  it("gère une facture vide", () => {
    expect(computeTotals([])).toEqual({ totalHtCents: 0, totalVatCents: 0, totalTtcCents: 0, vatBreakdown: [] });
  });

  it("gère l'exonération à 0 %", () => {
    const totals = computeTotals([{ quantityMilli: 1000, unitPriceCents: 120_000, vatRateBp: 0 }]);
    expect(totals.totalVatCents).toBe(0);
    expect(totals.totalTtcCents).toBe(120_000);
  });
});

describe("saisie au format français", () => {
  it("convertit les montants en centimes", () => {
    expect(parseEurosToCents("1 234,56")).toBe(123_456);
    expect(parseEurosToCents("650")).toBe(65_000);
    expect(parseEurosToCents("12,5 €")).toBe(1_250);
    expect(parseEurosToCents("0,07")).toBe(7);
    expect(parseEurosToCents("12,345")).toBeNull();
    expect(parseEurosToCents("-5")).toBeNull();
    expect(parseEurosToCents("abc")).toBeNull();
  });

  it("convertit les quantités en millièmes", () => {
    expect(parseQuantityToMilli("1,5")).toBe(1500);
    expect(parseQuantityToMilli("3")).toBe(3000);
    expect(parseQuantityToMilli("0,125")).toBe(125);
    expect(parseQuantityToMilli("0")).toBeNull();
    expect(parseQuantityToMilli("1,2345")).toBeNull();
    expect(formatQuantity(1500)).toBe("1,5");
    expect(formatQuantity(2000)).toBe("2");
    expect(formatQuantity(125)).toBe("0,125");
  });
});

describe("numérotation et échéances", () => {
  it("formate le numéro sur 6 chiffres", () => {
    expect(formatInvoiceNumber(2026, 142)).toBe("FAC-2026-000142");
    expect(formatInvoiceNumber(2026, 1)).toBe("FAC-2026-000001");
    expect(() => formatInvoiceNumber(2026, 0)).toThrow();
    expect(() => formatInvoiceNumber(2026, 1_000_000)).toThrow();
  });

  it("n'est en retard qu'envoyée et après l'échéance", () => {
    const today = new Date("2026-10-12T10:00:00Z");
    expect(isOverdue("SENT", new Date("2026-10-11T00:00:00Z"), today)).toBe(true);
    expect(isOverdue("SENT", new Date("2026-10-12T00:00:00Z"), today)).toBe(false);
    expect(isOverdue("PAID", new Date("2026-01-01T00:00:00Z"), today)).toBe(false);
    expect(isOverdue("DRAFT", new Date("2026-01-01T00:00:00Z"), today)).toBe(false);
  });
});
