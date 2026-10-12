import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Pagination par liens : conserve les filtres de l'URL. */
export function Pager({
  page,
  pages,
  total,
  basePath,
  params,
  unit,
}: {
  page: number;
  pages: number;
  total: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  unit: [singular: string, plural: string];
}) {
  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "page") search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  const window = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        <span className="font-mono text-foreground">{total}</span> {total > 1 ? unit[1] : unit[0]}
      </p>
      {pages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <PageLink href={href(page - 1)} disabled={page <= 1} label="Page précédente">
              <ChevronLeft className="size-4" />
            </PageLink>
          </li>
          {window.map((n, index) => (
            <li key={n} className="flex items-center gap-1">
              {index > 0 && n - window[index - 1]! > 1 && <span className="px-1 text-muted-foreground">…</span>}
              <PageLink href={href(n)} active={n === page} label={`Page ${n}`}>
                {n}
              </PageLink>
            </li>
          ))}
          <li>
            <PageLink href={href(page + 1)} disabled={page >= pages} label="Page suivante">
              <ChevronRight className="size-4" />
            </PageLink>
          </li>
        </ul>
      )}
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  label,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-full font-mono text-sm transition-colors",
    active ? "bg-foreground text-background" : "hover:bg-muted",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span className={className} aria-disabled aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} aria-label={label} aria-current={active ? "page" : undefined} scroll={false}>
      {children}
    </Link>
  );
}
