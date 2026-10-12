"use client";

import { BadgeCheck, Download, LoaderCircle, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { deleteDraftAction, issueInvoiceAction, markPaidAction, markUnpaidAction } from "@/app/(app)/app/factures/actions";
import { FormAlert } from "@/components/auth/form-alert";
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

type Props = {
  id: string;
  status: "DRAFT" | "SENT" | "PAID";
  canWrite: boolean;
  canExport: boolean;
  clientAnonymized: boolean;
};

function ConfirmAction({
  trigger,
  title,
  description,
  confirm,
  run,
  destructive,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirm: string;
  run: () => Promise<{ error?: string } | undefined | void>;
  destructive?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await run();
                if (result?.error) setError(result.error);
              });
            }}
          >
            {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function InvoiceActions({ id, status, canWrite, canExport, clientAnonymized }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {canWrite && status === "DRAFT" && (
          <>
            <Button asChild variant="outline" size="pill" className="rounded-full">
              <Link href={`/app/factures/${id}/modifier`}>
                <Pencil data-icon="inline-start" />
                Modifier
              </Link>
            </Button>
            {!clientAnonymized && (
              <ConfirmAction
                trigger={
                  <Button variant="brand" size="pill">
                    <Send data-icon="inline-start" />
                    Émettre la facture
                  </Button>
                }
                title="Émettre la facture ?"
                description="Elle recevra le prochain numéro de la séquence et deviendra inaltérable : plus aucune modification ni suppression ne sera possible."
                confirm="Émettre"
                run={() => issueInvoiceAction(id)}
              />
            )}
            <ConfirmAction
              destructive
              trigger={
                <Button variant="ghost" size="pill" className="rounded-full">
                  <Trash2 data-icon="inline-start" />
                  Supprimer le brouillon
                </Button>
              }
              title="Supprimer ce brouillon ?"
              description="Un brouillon n'a pas de numéro : sa suppression ne crée aucun trou dans la numérotation."
              confirm="Supprimer"
              run={() => deleteDraftAction(id)}
            />
          </>
        )}
        {canWrite && status === "SENT" && (
          <Button
            variant="brand"
            size="pill"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await markPaidAction(id);
                if (result?.error) setError(result.error);
              })
            }
          >
            {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <BadgeCheck data-icon="inline-start" />}
            Marquer comme payée
          </Button>
        )}
        {canWrite && status === "PAID" && (
          <ConfirmAction
            trigger={
              <Button variant="ghost" size="pill" className="rounded-full">
                <Undo2 data-icon="inline-start" />
                Annuler l&apos;encaissement
              </Button>
            }
            title="Annuler l'encaissement ?"
            description="La facture repassera au statut « Envoyée ». L'opération est journalisée."
            confirm="Confirmer"
            run={() => markUnpaidAction(id)}
          />
        )}
        {canExport && (
          <Button asChild variant="ink" size="pill">
            <a href={`/api/factures/${id}/pdf`} target="_blank" rel="noopener">
              <Download data-icon="inline-start" />
              Télécharger le PDF
            </a>
          </Button>
        )}
      </div>
      {!canWrite && !canExport && (
        <p className="text-sm text-muted-foreground">Consultation seule : votre rôle ne permet ni modification ni export.</p>
      )}
      {error && <FormAlert>{error}</FormAlert>}
    </div>
  );
}
