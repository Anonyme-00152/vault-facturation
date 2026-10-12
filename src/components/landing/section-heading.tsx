import { MaskedLines, Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  label,
  lines,
  intro,
  className,
  tone = "default",
}: {
  index: string;
  label: string;
  lines: React.ReactNode[];
  intro?: React.ReactNode;
  className?: string;
  tone?: "default" | "inverted";
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end", className)}>
      <div>
        <Reveal>
          <p
            className={cn(
              "label-mono mb-6 flex items-center gap-3",
              tone === "inverted" ? "text-white/55" : "text-muted-foreground",
            )}
          >
            <span className={tone === "inverted" ? "text-brand" : "text-foreground"}>{index}</span>
            <span className="h-px w-8 bg-current opacity-40" />
            {label}
          </p>
        </Reveal>
        <MaskedLines lines={lines} className="font-display text-[clamp(2.4rem,6vw,5.75rem)]" />
      </div>
      {intro && (
        <Reveal delay={0.15}>
          <p
            className={cn(
              "text-lg leading-relaxed",
              tone === "inverted" ? "text-white/65" : "text-muted-foreground",
            )}
          >
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}
