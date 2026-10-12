import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";

const STATS = [
  { value: 256, unit: "bits", label: "Clé de chiffrement AES-GCM pour chaque champ sensible." },
  { value: 15, unit: "min", label: "D'inactivité, puis déconnexion automatique côté serveur." },
  { value: 10, unit: "ans", label: "De conservation des factures, comme l'exige le Code de commerce." },
  { value: 0, unit: "donnée", label: "Personnelle écrite dans les logs : elles sont masquées à la source." },
];

export function Stats() {
  return (
    <section className="border-y border-border px-5 md:px-10" aria-label="Chiffres clés">
      <div className="mx-auto grid max-w-[1440px] sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.unit}
            delay={i * 0.08}
            className="border-border py-12 sm:px-8 sm:not-first:border-l max-sm:not-first:border-t lg:py-16 sm:[&:nth-child(3)]:border-l-0 lg:[&:nth-child(3)]:border-l"
          >
            <div className="flex items-baseline gap-2">
              <Counter value={stat.value} className="font-display text-[clamp(3.5rem,7vw,6rem)] tabular" />
              <span className="label-mono text-muted-foreground">{stat.unit}</span>
            </div>
            <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
