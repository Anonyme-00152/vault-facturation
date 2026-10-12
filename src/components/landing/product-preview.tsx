"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { VaultMark } from "@/components/brand/logo";

import { SectionHeading } from "./section-heading";

const BARS = [42, 55, 48, 63, 58, 71, 66, 74, 69, 81, 77, 92];
const ROWS = [
  { number: "FAC-2026-000142", client: "Atelier Nébule", amount: "4 860,00 €", status: "Payée", tone: "paid" },
  { number: "FAC-2026-000141", client: "Brasserie du Quai Sud", amount: "1 254,40 €", status: "Envoyée", tone: "sent" },
  { number: "FAC-2026-000139", client: "Studio Orbe & Fils", amount: "2 980,00 €", status: "En retard", tone: "late" },
  { number: "FAC-2026-000137", client: "Menuiserie Valcourt", amount: "736,80 €", status: "Payée", tone: "paid" },
];
const TONES: Record<string, string> = {
  paid: "bg-[#d2ff00] text-[#2c3500]",
  sent: "bg-[#262044] text-[#c3baff]",
  late: "bg-[#3b1a17] text-[#ff8a70]",
};

/** Illustration du tableau de bord (données fictives), toujours en mode Nuit. */
function AppPreview() {
  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0b14] text-[#eceaf5] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)]">
      <aside className="hidden w-48 shrink-0 flex-col gap-1 border-r border-white/8 p-4 md:flex">
        <div className="mb-5 flex items-center gap-2">
          <VaultMark className="size-5" />
          <span className="font-display text-sm">VAULT</span>
        </div>
        {["Tableau de bord", "Clients", "Factures", "Journal d'audit"].map((item, i) => (
          <span
            key={item}
            className={`rounded-lg px-2.5 py-1.5 text-[0.72rem] ${i === 0 ? "bg-white/8 text-white" : "text-white/50"}`}
          >
            {item}
          </span>
        ))}
        <div className="mt-auto rounded-xl border border-white/8 p-3">
          <span className="label-mono text-[0.55rem] text-white/45">Session</span>
          <div className="mt-1 font-mono text-sm text-[#d2ff00]">14:32</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="label-mono text-[0.55rem] text-white/45">Lundi 12 octobre</span>
            <div className="font-display text-lg md:text-xl">Bonjour, Camille.</div>
          </div>
          <span className="rounded-full bg-[#d2ff00] px-3 py-1.5 text-[0.65rem] font-semibold text-[#12140a]">
            Nouvelle facture
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ["Encaissé · octobre", "48 920 €", "+12,4 %"],
            ["À encaisser", "21 340 €", "9 factures"],
            ["En retard", "3", "6 120 €"],
            ["Clients actifs", "20", "+2 ce mois"],
          ].map(([label, value, hint], i) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <span className="label-mono text-[0.52rem] text-white/45">{label}</span>
              <div className="font-display mt-1.5 text-base md:text-lg">{value}</div>
              <span className={`text-[0.62rem] ${i === 2 ? "text-[#ff8a70]" : "text-white/50"}`}>{hint}</span>
            </div>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-2 md:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-36 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <span className="label-mono text-[0.52rem] text-white/45">Chiffre d&apos;affaires · 12 mois</span>
            <div className="absolute inset-x-3 top-9 bottom-3 flex items-end gap-1.5">
              {BARS.map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-[4px] ${i === BARS.length - 1 ? "bg-[#d2ff00]" : "bg-[#3a3350]"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="hidden flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-3 md:flex">
            <span className="label-mono text-[0.52rem] text-white/45">Factures récentes</span>
            {ROWS.map((row) => (
              <div key={row.number} className="flex items-center justify-between gap-2 border-b border-white/6 py-1.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-[0.68rem]">{row.client}</div>
                  <div className="font-mono text-[0.55rem] text-white/40">{row.number}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] ${TONES[row.tone]}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPreview() {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section id="produit" className="scroll-mt-24 px-3 py-24 md:px-5 md:py-36">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading
          className="px-2 md:px-5"
          index="03"
          label="Produit"
          lines={["Tout ce qu'il faut.", "Rien de plus."]}
          intro="Clients, factures, échéances et accès : l'essentiel tient sur un écran. Les montants sont calculés au centime, la numérotation est continue et sans trou."
        />

        <div
          ref={frame}
          className="relative mt-16 overflow-hidden rounded-[28px] bg-plum dark:ring-1 dark:ring-white/10 px-4 pt-10 pb-0 [perspective:1600px] md:mt-24 md:px-16 md:pt-20"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgb(142_123_255/0.45),transparent_70%),radial-gradient(30%_40%_at_90%_90%,rgb(210_255_0/0.14),transparent_70%)]"
          />
          <motion.div
            style={reduced ? undefined : { rotateX, scale, y, transformOrigin: "50% 100%" }}
            className="relative mx-auto h-[420px] max-w-6xl md:h-[600px]"
          >
            <AppPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
