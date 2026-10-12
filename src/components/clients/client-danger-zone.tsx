"use client";

import { EyeOff, LoaderCircle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { anonymizeClientAction, deleteClientAction } from "@/app/(app)/app/clients/actions";
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

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="pill" className="rounded-full">
          <Trash2 data-icon="inline-start" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Possible uniquement pour un client sans facture. Cette suppression est définitive et journalisée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await deleteClientAction(id);
                if (result?.error) setError(result.error);
              });
            }}
          >
            {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AnonymizeClientButton({ id, name, invoiceCount }: { id: string; name: string; invoiceCount: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="pill" className="rounded-full">
          <EyeOff data-icon="inline-start" />
          Anonymiser (droit à l&apos;effacement)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anonymiser {name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Nom, SIRET, e-mail, téléphone et adresse seront effacés de la fiche. Opération irréversible.
            {invoiceCount > 0 &&
              ` Les ${invoiceCount} factures émises restent conservées 10 ans avec l'identité figée au moment de l'émission (article L123-22 du Code de commerce).`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await anonymizeClientAction(id);
                if (result?.error) setError(result.error);
              });
            }}
          >
            {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            Anonymiser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
