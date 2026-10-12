/**
 * Mentions légales d'une facture française (articles L441-9 du Code de commerce et
 * 242 nonies A de l'annexe II du CGI), partagées par l'aperçu HTML et le PDF.
 */
import { formatEUR } from "./format";

type Seller = {
  companyName: string;
  legalForm: string;
  shareCapitalCents: number;
  siren: string;
  rcs: string;
  vatNumber: string;
  latePenaltyRateBp: number;
};

export function legalFooter(seller: Seller): string {
  const siren = seller.siren.replace(/(\d{3})(?=\d)/g, "$1 ");
  return `${seller.companyName} ${seller.legalForm} au capital de ${formatEUR(seller.shareCapitalCents)} · SIREN ${siren} · ${seller.rcs} · TVA ${seller.vatNumber}`;
}

export function paymentMentions(input: {
  seller: Seller;
  paymentTermsDays: number;
  clientIsCompany: boolean;
  hasZeroVat: boolean;
}): string[] {
  const rate = (input.seller.latePenaltyRateBp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const mentions = [
    input.paymentTermsDays === 0
      ? "Paiement à réception de la facture."
      : `Paiement à ${input.paymentTermsDays} jours à compter de la date d'émission.`,
    "Pas d'escompte pour paiement anticipé.",
    `En cas de retard de paiement, pénalités au taux annuel de ${rate} %.`,
  ];
  if (input.clientIsCompany) {
    mentions.push("Indemnité forfaitaire pour frais de recouvrement : 40 € (article D441-5 du Code de commerce).");
  }
  if (input.hasZeroVat) mentions.push("Lignes à 0 % : exonération de TVA, article 261 du CGI.");
  mentions.push("Nature de l'opération : prestation de services.");
  return mentions;
}

export const formatSiretDisplay = (siret: string) => siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
