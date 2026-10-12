"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

/** Champ de recherche synchronisé avec l'URL (partageable, retour arrière fonctionnel). */
export function SearchField({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const update = (next: string) => {
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const search = new URLSearchParams(params);
      if (next.trim()) search.set("q", next.trim());
      else search.delete("q");
      search.delete("page");
      startTransition(() => router.replace(`${pathname}?${search.toString()}`, { scroll: false }));
    }, 300);
  };

  return (
    <label className="relative flex h-11 w-full items-center md:max-w-sm">
      <Search className={cn("absolute left-4 size-4 text-muted-foreground", pending && "animate-pulse")} />
      <span className="sr-only">Rechercher</span>
      <input
        type="search"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-full border border-border bg-card pr-10 pl-11 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => update("")}
          aria-label="Effacer la recherche"
          className="absolute right-3 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      )}
    </label>
  );
}

/** Filtres sous forme de pastilles : chaque pastille est un lien (fonctionne sans JavaScript). */
export function FilterPills({
  name,
  options,
}: {
  name: string;
  options: { value: string | undefined; label: string; count?: number }[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(name) ?? undefined;

  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {options.map((option) => {
        const search = new URLSearchParams(params);
        if (option.value) search.set(name, option.value);
        else search.delete(name);
        search.delete("page");
        const active = current === option.value;
        return (
          <Link
            key={option.label}
            href={`${pathname}?${search.toString()}`}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="font-mono text-[0.7rem] opacity-70">{option.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}
