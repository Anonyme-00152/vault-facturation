import { CircleAlert, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormAlert({
  children,
  tone = "error",
  className,
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
  className?: string;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
        tone === "error"
          ? "bg-status-overdue text-status-overdue-foreground"
          : "bg-status-sent text-status-sent-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
