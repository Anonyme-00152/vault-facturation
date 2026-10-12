"use client";

import { Eraser, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { runPurgeAction, saveRetentionAction } from "@/app/(app)/app/admin/rgpd/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [12, 24, 36, 60];

export function RetentionPicker({ months }: { months: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Durée de conservation des clients inactifs" aria-busy={pending}>
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={months === option}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveRetentionAction(option);
              if (result.error) toast.error(result.error);
              else toast.success(`Conservation fixée à ${option / 12} an${option > 12 ? "s" : ""}`);
            })
          }
          className={cn(
            "h-11 rounded-full border px-5 text-sm transition-colors",
            months === option ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/30",
          )}
        >
          {option / 12} an{option > 12 ? "s" : ""}
        </button>
      ))}
    </div>
  );
}

export function PurgeButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="pill" className="rounded-full" disabled={count === 0 || pending}>
          {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Eraser data-icon="inline-start" />}
          Anonymiser maintenant ({count})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lancer la purge ?</AlertDialogTitle>
          <AlertDialogDescription>
            {count} fiche{count > 1 ? "s" : ""} client{count > 1 ? "s" : ""} inactive{count > 1 ? "s" : ""} {count > 1 ? "seront" : "sera"} anonymisée
            {count > 1 ? "s" : ""}. Les factures émises restent conservées jusqu&apos;au terme légal de 10 ans. Opération irréversible et
            journalisée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await runPurgeAction();
                toast.success(`${result.anonymized} client${result.anonymized > 1 ? "s" : ""} anonymisé${result.anonymized > 1 ? "s" : ""}`);
              })
            }
          >
            Anonymiser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
