import { Search } from "lucide-react";

import { ThemeToggle } from "@/components/brand/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { SessionTimer } from "./session-timer";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 rounded-t-[inherit] border-b border-border bg-card/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="-ml-1 rounded-lg" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />

      <button
        type="button"
        className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-full border border-border bg-background/60 px-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">
          <span className="sm:hidden">Rechercher…</span>
          <span className="hidden sm:inline">Rechercher un client, une facture…</span>
        </span>
        <kbd className="hidden rounded-md border border-border px-1.5 font-mono text-[0.65rem] sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <SessionTimer />
        <ThemeToggle compact className="hidden sm:inline-flex" />
      </div>
    </header>
  );
}
