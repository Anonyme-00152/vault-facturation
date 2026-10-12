"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import type { VaultSceneProps } from "./vault-scene";

const VaultScene = dynamic(() => import("./vault-scene"), {
  ssr: false,
  loading: () => <VaultFallback />,
});

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const noop = () => () => {};

/**
 * Charge la scène 3D seulement côté client, la met en pause hors écran
 * et affiche une version statique si WebGL n'est pas disponible.
 */
export function VaultCanvas({
  className,
  ...props
}: Omit<VaultSceneProps, "paused" | "reducedMotion"> & { className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className={cn("relative size-full", className)}>
      {webgl ? (
        <VaultScene {...props} reducedMotion={reducedMotion} paused={!visible} />
      ) : (
        <VaultFallback />
      )}
    </div>
  );
}

/** Version statique dessinée en SVG : chargement, absence de WebGL. */
export function VaultFallback() {
  return (
    <div className="grid size-full place-items-center" aria-hidden>
      <svg viewBox="0 0 200 200" className="h-3/4 max-h-80 opacity-80">
        <defs>
          <radialGradient id="vault-fallback" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#5b4a99" />
            <stop offset="100%" stopColor="#1b1530" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#vault-fallback)" stroke="#8e7bff" strokeOpacity=".4" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#dfe2f2" strokeOpacity=".25" strokeWidth="10" />
        <circle cx="100" cy="100" r="36" fill="none" stroke="#dfe2f2" strokeOpacity=".6" strokeWidth="3" />
        {[90, 210, 330].map((angle) => (
          <line
            key={angle}
            x1="100"
            y1="100"
            x2={100 + Math.cos((angle * Math.PI) / 180) * 46}
            y2={100 - Math.sin((angle * Math.PI) / 180) * 46}
            stroke="#dfe2f2"
            strokeOpacity=".7"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        <circle cx="100" cy="100" r="7" fill="#d2ff00" />
      </svg>
    </div>
  );
}
