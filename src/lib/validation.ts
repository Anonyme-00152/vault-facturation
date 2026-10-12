import { z } from "zod";

import { VAT_RATES_BP, parseEurosToCents, parseQuantityToMilli } from "./invoice-math";

/* ── Contrôles unitaires ──────────────────────────────────── */

/** Algorithme de Luhn, utilisé par les numéros SIREN et SIRET. */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export const normalizeSiret = (value: string) => value.replace(/\s/g, "");
export const isValidSiret = (value: string) => {
  const digits = normalizeSiret(value);
  return /^\d{14}$/.test(digits) && luhnValid(digits);
};

/** Numéro de TVA intracommunautaire français : FR + clé (2) + SIREN (9). */
export function frenchVatNumber(siren: string): string {
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

/** Téléphone français, renvoyé au format « 01 23 45 67 89 ». */
export function normalizeFrenchPhone(value: string): string | null {
  let digits = value.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+33")) digits = `0${digits.slice(3)}`;
  if (digits.startsWith("0033")) digits = `0${digits.slice(4)}`;
  if (!/^0[1-9]\d{8}$/.test(digits)) return null;
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "motdepasse123",
  "motdepasse1234",
  "azertyuiop12",
  "azertyuiopqs",
  "qwertyuiop12",
  "password1234",
  "password12345",
  "administrateur",
  "bonjour123456",
  "soleil123456",
  "facturation12",
  "vaultfacturation",
]);

/** Politique de mot de passe : longueur avant tout (recommandations ANSSI et NIST). */
export function passwordIssues(password: string, context: { email?: string; name?: string } = {}): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Au moins 12 caractères.");
  if (password.length > 128) issues.push("128 caractères au maximum.");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) issues.push("Ce mot de passe est trop courant.");
  if (new Set(password).size < 5) issues.push("Variez davantage les caractères.");
  const local = context.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) {
    issues.push("Ne réutilisez pas votre adresse e-mail.");
  }
  for (const part of context.name?.toLowerCase().split(/\s+/) ?? []) {
    if (part.length >= 4 && password.toLowerCase().includes(part)) {
      issues.push("Ne réutilisez pas votre nom.");
      break;
    }
  }
  return issues;
}

/** Score indicatif de 0 à 4 pour la jauge de robustesse. */
export function passwordScore(password: string): number {
  if (password.length < 12) return password.length >= 8 ? 1 : 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  return Math.min(4, 2 + (password.length >= 16 ? 1 : 0) + (classes >= 3 ? 1 : 0));
}

/* ── Schémas Zod ──────────────────────────────────────────── */

const trimmed = (max: number) => z.string().trim().max(max, `${max} caractères au maximum`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Adresse e-mail invalide" }));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis").max(128),
});

export const totpCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres"));

export const backupCodeSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{10}$/, "Code de secours invalide"));

export const addressSchema = z.object({
  line1: trimmed(120).min(3, "Adresse requise"),
  line2: trimmed(120)
    .transform((value) => value || undefined)
    .optional(),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal à 5 chiffres"),
  city: trimmed(80).min(1, "Ville requise"),
  country: trimmed(60).default("France"),
});

export type Address = z.infer<typeof addressSchema>;

export const clientSchema = z
  .object({
    type: z.enum(["ENTREPRISE", "PARTICULIER"]),
    name: trimmed(120).min(2, "Nom ou raison sociale requis"),
    // Champs facultatifs : une saisie vide devient `undefined`.
    siret: z
      .string()
      .trim()
      .transform((value) => normalizeSiret(value) || undefined)
      .refine((value) => !value || isValidSiret(value), "SIRET invalide (14 chiffres, clé de contrôle)")
      .optional(),
    vatNumber: z
      .string()
      .trim()
      .toUpperCase()
      .transform((value) => value.replace(/\s/g, "") || undefined)
      .refine((value) => !value || /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(value), "Numéro de TVA invalide")
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .transform((value) => value || undefined)
      .refine((value) => !value || z.email().safeParse(value).success, "Adresse e-mail invalide")
      .optional(),
    phone: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (!value) return undefined;
        const phone = normalizeFrenchPhone(value);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "Numéro de téléphone français invalide" });
          return z.NEVER;
        }
        return phone;
      })
      .optional(),
    address: addressSchema,
    paymentTermsDays: z.coerce
      .number()
      .int()
      .min(0)
      .max(60, "60 jours au maximum (article L441-10 du Code de commerce)"),
  })
  .superRefine((client, ctx) => {
    if (client.type === "ENTREPRISE" && !client.siret) {
      ctx.addIssue({ code: "custom", path: ["siret"], message: "SIRET requis pour une entreprise" });
    }
  });

export type ClientInput = z.infer<typeof clientSchema>;

export const invoiceLineSchema = z.object({
  designation: trimmed(200).min(2, "Désignation requise"),
  quantity: z.string().transform((value, ctx) => {
    const parsed = parseQuantityToMilli(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: "Quantité invalide" });
      return z.NEVER;
    }
    return parsed;
  }),
  unitPrice: z.string().transform((value, ctx) => {
    const parsed = parseEurosToCents(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: "Prix invalide" });
      return z.NEVER;
    }
    return parsed;
  }),
  vatRateBp: z.coerce
    .number()
    .refine((value) => (VAT_RATES_BP as readonly number[]).includes(value), "Taux de TVA invalide"),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");

export const invoiceDraftSchema = z.object({
  clientId: z.uuid({ error: "Client requis" }),
  serviceDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
  dueInDays: z.coerce.number().int().min(0).max(60),
  notes: trimmed(500)
    .transform((value) => value || undefined)
    .optional(),
  lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne").max(50, "50 lignes au maximum"),
});

export type InvoiceDraftInput = z.infer<typeof invoiceDraftSchema>;

/** Transforme les erreurs Zod en messages par champ pour les formulaires. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
