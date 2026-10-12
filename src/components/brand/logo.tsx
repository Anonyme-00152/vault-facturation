import { cn } from "@/lib/utils";

/** Le symbole : une roue de coffre-fort, cœur citron. */
export function VaultMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
      {[90, 210, 330].map((angle) => (
        <line
          key={angle}
          x1={16 + Math.cos((angle * Math.PI) / 180) * 5.5}
          y1={16 - Math.sin((angle * Math.PI) / 180) * 5.5}
          x2={16 + Math.cos((angle * Math.PI) / 180) * 10}
          y2={16 - Math.sin((angle * Math.PI) / 180) * 10}
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ))}
      <circle cx="16" cy="16" r="4.2" fill="#d2ff00" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <VaultMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] tracking-[-0.02em]">VAULT</span>
        {subtitle && <span className="label-mono mt-1 text-[0.58rem] opacity-60">Facturation</span>}
      </span>
    </span>
  );
}
