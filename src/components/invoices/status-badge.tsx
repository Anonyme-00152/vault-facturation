import { cn } from "@/lib/utils";

export type InvoiceDisplayStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

const STYLES: Record<InvoiceDisplayStatus, { label: string; className: string; dot: string }> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-status-draft text-status-draft-foreground",
    dot: "bg-current opacity-50",
  },
  SENT: {
    label: "Envoyée",
    className: "bg-status-sent text-status-sent-foreground",
    dot: "bg-current",
  },
  PAID: {
    label: "Payée",
    className: "bg-status-paid text-status-paid-foreground",
    dot: "bg-current",
  },
  OVERDUE: {
    label: "En retard",
    className: "bg-status-overdue text-status-overdue-foreground",
    dot: "bg-current animate-pulse-soft",
  },
};

export function StatusBadge({ status, className }: { status: InvoiceDisplayStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        style.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}

export const STATUS_LABELS: Record<InvoiceDisplayStatus, string> = {
  DRAFT: STYLES.DRAFT.label,
  SENT: STYLES.SENT.label,
  PAID: STYLES.PAID.label,
  OVERDUE: STYLES.OVERDUE.label,
};
