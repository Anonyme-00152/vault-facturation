"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Défilement fluide (Lenis) pour les pages vitrines. Désactivé si l'utilisateur réduit les animations. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, anchors: { offset: -80 }, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
