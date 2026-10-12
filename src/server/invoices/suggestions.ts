import "server-only";

import { CATALOG } from "../demo/fixtures";

/** Prestations fréquentes proposées dans l'éditeur (catalogue du studio de démonstration). */
export function invoiceSuggestions() {
  return CATALOG.map((item) => ({
    designation: item.designation,
    unitPrice: (item.unit / 100).toFixed(2).replace(".", ","),
    vatRateBp: item.vat,
  }));
}
