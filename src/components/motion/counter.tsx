"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Compteur qui défile jusqu'à sa valeur quand il entre à l'écran. */
export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduced) {
      node.textContent = value.toLocaleString("fr-FR");
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("fr-FR");
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={className}>
      {reduced ? value.toLocaleString("fr-FR") : 0}
    </span>
  );
}
