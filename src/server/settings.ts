import "server-only";

import type { Settings } from "@/generated/prisma/client";

import { db, type Tx } from "./db";

export async function getSettings(tx?: Tx): Promise<Settings> {
  const settings = await (tx ?? db).settings.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("Paramètres de l'organisation absents : lancez le seed.");
  return settings;
}

/** Identité du vendeur, figée sur chaque facture émise (mentions légales obligatoires). */
export type SellerSnapshot = {
  companyName: string;
  legalForm: string;
  shareCapitalCents: number;
  siren: string;
  rcs: string;
  vatNumber: string;
  address: { line1: string; line2?: string; postalCode: string; city: string };
  email: string;
  phone: string;
  iban: string;
  bic: string;
  latePenaltyRateBp: number;
};

export function toSellerSnapshot(settings: Settings): SellerSnapshot {
  return {
    companyName: settings.companyName,
    legalForm: settings.legalForm,
    shareCapitalCents: settings.shareCapitalCents,
    siren: settings.siren,
    rcs: settings.rcs,
    vatNumber: settings.vatNumber,
    address: {
      line1: settings.addressLine1,
      ...(settings.addressLine2 ? { line2: settings.addressLine2 } : {}),
      postalCode: settings.postalCode,
      city: settings.city,
    },
    email: settings.email,
    phone: settings.phone,
    iban: settings.iban,
    bic: settings.bic,
    latePenaltyRateBp: settings.latePenaltyRateBp,
  };
}
