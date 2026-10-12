"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function LogoutLink({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
        className,
      )}
    >
      <LogOut className="size-4" />
      {children ?? "Se déconnecter"}
    </button>
  );
}
