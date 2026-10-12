import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  featured = false,
  children,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: "default" | "positive" | "danger";
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative flex min-h-36 flex-col md:min-h-44 overflow-hidden rounded-3xl p-5",
        featured ? "bg-ink text-paper dark:bg-plum" : "surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className={cn("label-mono", featured ? "text-paper/60" : "text-muted-foreground")}>{label}</h2>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full",
            featured ? "bg-brand text-brand-foreground" : "bg-muted text-foreground",
            tone === "danger" && !featured && "bg-status-overdue text-status-overdue-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="font-display mt-auto pt-6 text-[2.1rem] tabular">{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-2 text-sm",
            featured ? "text-paper/65" : "text-muted-foreground",
            tone === "positive" && (featured ? "text-brand" : "text-electric"),
            tone === "danger" && "text-status-overdue-foreground",
          )}
        >
          {hint}
        </p>
      )}
      {children}
    </section>
  );
}
