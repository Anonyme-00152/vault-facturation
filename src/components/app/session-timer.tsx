"use client";

import { Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { keepAliveAction, logoutAction } from "@/app/(auth)/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const PING_EVERY_MS = 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "pointermove"] as const;

/**
 * Compte à rebours d'inactivité, aligné sur le serveur : il repart de la dernière
 * requête connue du serveur. L'activité de l'utilisateur prolonge la session par un
 * signal au plus une fois par minute. À zéro, la session est fermée.
 */
export function SessionTimer() {
  const lastServerTouch = useRef(0);
  const pinging = useRef(false);
  const [remaining, setRemaining] = useState(IDLE_LIMIT_MS);
  const [, startTransition] = useTransition();

  const ping = useCallback(async () => {
    if (pinging.current) return;
    pinging.current = true;
    try {
      const result = await keepAliveAction();
      if (result.ok) lastServerTouch.current = Date.now();
    } finally {
      pinging.current = false;
    }
  }, []);

  useEffect(() => {
    lastServerTouch.current = Date.now();
    const onActivity = () => {
      if (Date.now() - lastServerTouch.current > PING_EVERY_MS) void ping();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    const interval = window.setInterval(() => {
      const left = Math.max(0, IDLE_LIMIT_MS - (Date.now() - lastServerTouch.current));
      setRemaining(left);
      if (left === 0) {
        window.clearInterval(interval);
        startTransition(() => logoutAction("inactivite"));
      }
    }, 1000);
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.clearInterval(interval);
    };
  }, [ping]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const warning = remaining <= WARNING_MS && remaining > 0;
  const circumference = 2 * Math.PI * 8;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="timer"
            aria-label={`Déconnexion automatique dans ${minutes} minutes et ${seconds} secondes d'inactivité`}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm",
              remaining <= 2 * WARNING_MS && "border-status-overdue-foreground/40 text-status-overdue-foreground",
            )}
          >
            <svg viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden>
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="2.5" />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke={remaining <= 2 * WARNING_MS ? "currentColor" : "var(--electric)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - remaining / IDLE_LIMIT_MS)}
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

      <AlertDialog open={warning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toujours là ?</AlertDialogTitle>
            <AlertDialogDescription>
              Sans activité, votre session sera fermée dans {seconds} seconde{seconds > 1 ? "s" : ""} pour protéger les
              données clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => startTransition(() => logoutAction())}>Se déconnecter</AlertDialogCancel>
            <AlertDialogAction onClick={() => void ping()}>Rester connecté</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
