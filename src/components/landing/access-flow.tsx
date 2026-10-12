"use client";

import { Check, FileSignature, LayoutDashboard, LockKeyhole, Smartphone } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";

import { Reveal } from "@/components/motion/reveal";

import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: LockKeyhole,
    title: "Identification",
    text: "Email et mot de passe de 12 caractères minimum. Cinq échecs verrouillent le compte un quart d'heure.",
    preview: (
      <div className="space-y-2">
        <div className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-xs leading-8 text-white/50">
          camille@atelier-nebule.test
        </div>
        <div className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-xs leading-8 tracking-[0.3em] text-white/50">
          ••••••••••••••
        </div>
      </div>
    ),
  },
  {
    icon: Smartphone,
    title: "Double authentification",
    text: "Un code à six chiffres généré par l'application d'authentification. Codes de secours à usage unique.",
    preview: (
      <div className="flex gap-1.5">
        {["4", "8", "1", "9", "0", "6"].map((digit, i) => (
          <span
            key={i}
            className="grid h-10 flex-1 place-items-center rounded-lg border border-white/12 bg-white/5 font-mono text-sm text-white"
          >
            {digit}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: FileSignature,
    title: "Charte de confidentialité",
    text: "Lue et acceptée avant tout accès. Date, adresse IP et version sont enregistrées ; chaque nouvelle version est à réaccepter.",
    preview: (
      <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/5 p-3">
        <span className="grid size-5 place-items-center rounded bg-brand text-brand-foreground">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="text-xs text-white/70">J&apos;ai lu et j&apos;accepte · v3</span>
      </div>
    ),
  },
  {
    icon: LayoutDashboard,
    title: "Espace de travail",
    text: "Les données s'affichent selon votre rôle. Chaque consultation de fiche client est journalisée.",
    preview: (
      <div className="grid grid-cols-3 gap-1.5">
        {[62, 38, 84].map((height) => (
          <div key={height} className="flex h-16 items-end rounded-lg border border-white/12 bg-white/5 p-1.5">
            <div className="w-full rounded bg-brand/80" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
    ),
  },
];

/** Le parcours d'accès, présenté comme un circuit qui s'allume au défilement. */
export function AccessFlow() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 85%", "end 45%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <section
      id="parcours"
      className="relative scroll-mt-24 overflow-hidden bg-night px-5 py-24 text-white md:px-10 md:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_0%,rgb(142_123_255/0.22),transparent),radial-gradient(40%_40%_at_0%_100%,rgb(26_47_251/0.18),transparent)]"
      />
      <div className="relative mx-auto max-w-[1440px]">
        <SectionHeading
          tone="inverted"
          index="02"
          label="Parcours d'accès"
          lines={["Quatre portes", "avant vos données."]}
          intro="Le contrôle ne repose pas sur l'interface : le serveur bloque chaque route tant qu'une étape manque. Désactiver JavaScript n'ouvre rien."
        />

        <div ref={track} className="relative mt-20 md:mt-28">
          <div aria-hidden className="absolute top-6 right-0 left-0 hidden h-px bg-white/12 lg:block">
            <motion.div
              className="h-px origin-left bg-brand shadow-[0_0_16px_rgb(210_255_0/0.7)]"
              style={{ scaleX: reduced ? 1 : fill }}
            />
          </div>

          <ol className="grid gap-5 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12}>
                <li className="relative flex h-full flex-col">
                  <span className="relative z-10 grid size-12 place-items-center rounded-full border border-white/15 bg-night text-brand">
                    <step.icon className="size-5" />
                  </span>
                  <div className="mt-6 flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <span className="label-mono text-white/45">Étape {i + 1}</span>
                    <h3 className="font-display mt-3 text-2xl">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">{step.text}</p>
                    <div className="mt-auto pt-6">{step.preview}</div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
