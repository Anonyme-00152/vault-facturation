"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Bascule « Papier / Nuit » : une pilule à curseur glissant. */
export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "group relative inline-flex h-9 items-center rounded-full border border-border bg-card/60 p-1 text-[0.7rem] backdrop-blur",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-foreground transition-transform duration-500 ease-(--ease-vault)",
          dark && "translate-x-full",
        )}
      />
      <span
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2.5 transition-colors duration-300",
          dark ? "text-muted-foreground" : "text-background",
        )}
      >
        <Sun className="size-3.5" />
        {!compact && <span className="label-mono text-[0.6rem]">Papier</span>}
      </span>
      <span
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2.5 transition-colors duration-300",
          dark ? "text-background" : "text-muted-foreground",
        )}
      >
        <Moon className="size-3.5" />
        {!compact && <span className="label-mono text-[0.6rem]">Nuit</span>}
      </span>
    </button>
  );
}
