"use client";

import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { MaskedLines } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { VaultCanvas } from "@/components/vault/vault-canvas";

const CHIPS = [
  { label: "AES-256-GCM", detail: "Chiffrement champ par champ", className: "top-5 left-5 md:top-8 md:left-8" },
  { label: "TOTP · RFC 6238", detail: "Double authentification", className: "top-5 right-5 md:top-8 md:right-8 hidden sm:flex" },
  { label: "SHA-256", detail: "Journal d'audit chaîné", className: "bottom-16 left-5 md:bottom-20 md:left-8 hidden md:flex" },
  { label: "Charte v3", detail: "Acceptée · 12 oct. 2026", className: "bottom-16 right-5 md:bottom-20 md:right-8 hidden md:flex" },
];

export function Hero() {
  const frame = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    progress.current = value;
  });
  const frameScale = useTransform(scrollYProgress, [0.25, 0.75], [1, 0.94]);
  const frameRadius = useTransform(scrollYProgress, [0.25, 0.75], [28, 48]);

  return (
    <section className="relative px-3 pt-24 md:px-5 md:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative flex flex-col gap-8 px-2 pb-8 md:px-5 lg:pb-12">
          <div>
            <motion.p
              className="label-mono mb-6 flex items-center gap-2 text-muted-foreground"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <span className="size-2 animate-pulse-soft rounded-full bg-brand ring-1 ring-foreground/20" />
              Clients et facturation · Sécurisé par conception
            </motion.p>
            <MaskedLines
              as="h1"
              animateOnMount
              className="font-display text-[clamp(3.4rem,10vw,11rem)]"
              lines={[
                <span key="a">Vos factures.</span>,
                <span key="b" className="text-muted-foreground/70">
                  Sous{" "}
                  <span className="relative inline-block text-foreground">
                    scellé
                    <span className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.24em] rounded-full bg-brand" />
                  </span>
                  .
                </span>,
              ]}
            />
          </div>

          <motion.div
            className="flex flex-col gap-7 lg:absolute lg:right-5 lg:bottom-14 lg:w-[min(27rem,34vw)]"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground lg:text-[1.1rem]">
              Vault réunit vos clients et vos factures dans un espace chiffré, verrouillé par double
              authentification et tracé de bout en bout. Pensé pour les petites entreprises qui
              prennent la confidentialité au sérieux.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="brand" size="xl">
                <Link href="/connexion">
                  Tester la démo
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full">
                <Link href="#securite">
                  <ShieldCheck data-icon="inline-start" />
                  Voir la sécurité
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          ref={frame}
          style={reduced ? undefined : { scale: frameScale, borderRadius: frameRadius }}
          initial={reduced ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate h-[72svh] min-h-[460px] overflow-hidden rounded-[28px] bg-night text-white ring-1 ring-white/0 md:h-[78svh] dark:ring-white/10"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_62%_45%,rgb(110_86_255/0.38),transparent_70%),radial-gradient(40%_50%_at_20%_80%,rgb(26_47_251/0.3),transparent_70%),radial-gradient(30%_30%_at_85%_15%,rgb(210_255_0/0.10),transparent_70%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgb(255_255_255/0.6)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.6)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
          />

          <VaultCanvas progressRef={progress} scale={0.92} />

          {CHIPS.map((chip, index) => (
            <motion.div
              key={chip.label}
              className={`glass absolute flex flex-col gap-0.5 rounded-2xl px-4 py-3 ${chip.className}`}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="label-mono text-brand">{chip.label}</span>
              <span className="text-sm text-white/75">{chip.detail}</span>
            </motion.div>
          ))}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 px-5 py-4 md:px-8">
            <span className="label-mono flex items-center gap-2 text-white/60">
              <ArrowDown className="size-3.5 animate-bounce" />
              Défiler pour explorer
            </span>
            <span className="label-mono text-white/60">Hébergement UE · Données fictives</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
