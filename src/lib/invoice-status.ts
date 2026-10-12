import type { InvoiceDisplayStatus } from "@/components/invoices/status-badge";

import { isOverdue } from "./invoice-math";

/** Statut affiché : « En retard » est déduit de l'échéance, jamais stocké. */
export function displayStatus(status: string, dueDate: Date, today?: Date): InvoiceDisplayStatus {
  if (isOverdue(status, dueDate, today)) return "OVERDUE";
  return status as InvoiceDisplayStatus;
}
