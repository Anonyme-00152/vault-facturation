import { Reveal } from "@/components/motion/reveal";

export type LegalSection = { id: string; title: string; content: React.ReactNode };

/** Mise en page des pages juridiques : sommaire collant et sections lisibles. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <div className="px-5 pt-32 pb-24 md:px-10 md:pt-40">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="label-mono text-muted-foreground">{eyebrow}</p>
          <h1 className="font-display mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] text-balance">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
          <p className="label-mono mt-6 text-muted-foreground">Mise à jour : {updatedAt}</p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav aria-label="Sommaire" className="hidden lg:block">
            <ol className="sticky top-28 space-y-2 border-l border-border pl-4 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
                    <span className="mr-2 font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="surface scroll-mt-28 p-6 md:p-8">
                <h2 className="font-display flex items-baseline gap-3 text-2xl">
                  <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_dt]:font-medium [&_dt]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
