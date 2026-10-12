"use client";

import { motion, useInView, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { useRef } from "react";

const EASE_VAULT = [0.35, 0, 0, 1] as const;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Apparition douce au défilement (montée + fondu). */
export function Reveal({
  delay = 0,
  y = 28,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT_EXPO }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Titre révélé ligne par ligne derrière un masque, façon Lusion.
 * L'observation se fait sur le titre lui-même : les lignes, masquées par
 * leur parent, ne seraient jamais « visibles » pour l'IntersectionObserver.
 */
export function MaskedLines({
  lines,
  className,
  delay = 0,
  as = "h2",
  animateOnMount = false,
}: {
  lines: React.ReactNode[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
  animateOnMount?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const reduced = useReducedMotion();
  const Tag = as;
  const shown = animateOnMount || inView;

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={reduced ? false : { y: "110%" }}
            animate={shown ? { y: "0%" } : undefined}
            transition={{ duration: 1.1, delay: delay + index * 0.09, ease: EASE_VAULT }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
