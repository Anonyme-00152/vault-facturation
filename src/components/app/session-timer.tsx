"use client";

import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const WARNING_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "pointermove"] as const;

/**
 * Compte à rebours d'inactivité. L'expiration réelle est contrôlée côté serveur ;
 * cet indicateur rend la règle des 15 minutes visible.
 */
export function SessionTimer() {
  const lastActivity = useRef(0);
  const [remaining, setRemaining] = useState(IDLE_LIMIT_MS);

  useEffect(() => {
    lastActivity.current = Date.now();
    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    const interval = window.setInterval(() => {
      setRemaining(Math.max(0, IDLE_LIMIT_MS - (Date.now() - lastActivity.current)));
    }, 1000);
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.clearInterval(interval);
    };
  }, []);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const ratio = remaining / IDLE_LIMIT_MS;
  const warning = remaining <= WARNING_MS;
  const circumference = 2 * Math.PI * 8;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="timer"
          aria-label={`Déconnexion automatique dans ${minutes} minutes et ${seconds} secondes d'inactivité`}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm",
            warning && "border-status-overdue-foreground/40 text-status-overdue-foreground",
          )}
        >
          <svg viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="2.5" />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke={warning ? "currentColor" : "var(--electric)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <span className="font-mono text-xs tabular">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <Timer className="mr-1 inline size-3.5" />
        Déconnexion après 15 minutes d&apos;inactivité
      </TooltipContent>
    </Tooltip>
  );
}
