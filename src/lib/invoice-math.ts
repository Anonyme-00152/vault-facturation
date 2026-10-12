/**
 * Calculs de facture, en entiers uniquement (centimes, millièmes, points de base) :
 * aucune erreur d'arrondi liée aux nombres à virgule flottante.
 *
 * Règle retenue : le montant HT de chaque ligne est arrondi au centime, puis la TVA
 * est calculée par taux sur la somme des bases HT de ce taux (récapitulatif par taux
 * exigé sur la facture). TTC = HT + TVA.
 */

/** Taux de TVA applicables en France métropolitaine, en points de base. */
export const VAT_RATES_BP = [2000, 1000, 550, 210, 0] as const;
export type VatRateBp = (typeof VAT_RATES_BP)[number];

export const VAT_RATE_LABELS: Record<VatRateBp, string> = {
  2000: "20 %",
  1000: "10 %",
  550: "5,5 %",
  210: "2,1 %",
  0: "0 %",
};

export type LineInput = {
  quantityMilli: number;
  unitPriceCents: number;
  vatRateBp: number;
};

export type VatBreakdown = { vatRateBp: number; baseHtCents: number; vatCents: number };

export type InvoiceTotals = {
  totalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  vatBreakdown: VatBreakdown[];
};

/** Division entière arrondie au plus proche, demi-unité arrondie vers l'infini (positif comme négatif). */
export function roundDiv(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) {
    throw new RangeError("Montant hors limites");
  }
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  return sign * Math.floor((2 * n + d) / (2 * d));
}

export function lineTotalHt(line: LineInput): number {
  return roundDiv(line.quantityMilli * line.unitPriceCents, 1000);
}

export function computeTotals(lines: LineInput[]): InvoiceTotals {
  const bases = new Map<number, number>();
  for (const line of lines) {
    bases.set(line.vatRateBp, (bases.get(line.vatRateBp) ?? 0) + lineTotalHt(line));
  }

  const vatBreakdown = [...bases.entries()]
    .sort(([a], [b]) => b - a)
    .map(([vatRateBp, baseHtCents]) => ({
      vatRateBp,
      baseHtCents,
      vatCents: roundDiv(baseHtCents * vatRateBp, 10_000),
    }));

  const totalHtCents = vatBreakdown.reduce((sum, row) => sum + row.baseHtCents, 0);
  const totalVatCents = vatBreakdown.reduce((sum, row) => sum + row.vatCents, 0);
  return { totalHtCents, totalVatCents, totalTtcCents: totalHtCents + totalVatCents, vatBreakdown };
}

/* ── Saisie : conversions entre texte français et entiers ──── */

/** « 1 234,56 » → 123456 centimes. Renvoie null si la saisie est invalide. */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) return null;
  const [units, decimals = ""] = normalized.split(".");
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
}

/** « 1,5 » → 1500 millièmes. Renvoie null si la saisie est invalide ou nulle. */
export function parseQuantityToMilli(input: string): number | null {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(normalized)) return null;
  const [units, decimals = ""] = normalized.split(".");
  const value = Number(units) * 1000 + Number(decimals.padEnd(3, "0"));
  return value > 0 ? value : null;
}

/** 1500 → « 1,5 » ; 2000 → « 2 ». */
export function formatQuantity(quantityMilli: number): string {
  const units = Math.trunc(quantityMilli / 1000);
  const decimals = String(quantityMilli % 1000).padStart(3, "0").replace(/0+$/, "");
  return decimals ? `${units},${decimals}` : String(units);
}

/* ── Numérotation ─────────────────────────────────────────── */

export function formatInvoiceNumber(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999_999) throw new RangeError("Numéro hors limites");
  return `FAC-${year}-${String(sequence).padStart(6, "0")}`;
}

/** « En retard » : envoyée, non payée, et dont l'échéance est passée. */
export function isOverdue(status: string, dueDate: Date, today = new Date()): boolean {
  const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return status === "SENT" && dueDate.getTime() < startOfToday.getTime();
}
