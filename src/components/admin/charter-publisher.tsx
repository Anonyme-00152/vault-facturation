"use client";

import { LoaderCircle, Megaphone } from "lucide-react";
import { useActionState, useState } from "react";

import { publishCharterAction, type CharterState } from "@/app/(app)/app/admin/charte/actions";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CharterPublisher({ nextVersion, title, content }: { nextVersion: number; title: string; content: string }) {
  const [state, action, pending] = useActionState<CharterState, FormData>(publishCharterAction, {});
  const [form, setForm] = useState<HTMLFormElement | null>(null);

  return (
    <form ref={setForm} action={action} className="space-y-5" noValidate>
      <Field data-invalid={Boolean(state.errors?.title) || undefined}>
        <FieldLabel htmlFor="charter-title">Titre</FieldLabel>
        <Input id="charter-title" name="title" defaultValue={title} className="h-11 rounded-xl bg-card" />
        {state.errors?.title && <FieldError>{state.errors.title}</FieldError>}
      </Field>
      <Field data-invalid={Boolean(state.errors?.content) || undefined}>
        <FieldLabel htmlFor="charter-content">Texte de la charte</FieldLabel>
        <Textarea id="charter-content" name="content" defaultValue={content} rows={8} className="rounded-xl bg-card leading-relaxed" />
        {state.errors?.content ? (
          <FieldError>{state.errors.content}</FieldError>
        ) : (
          <FieldDescription>Publiée comme version {nextVersion}. Tous les utilisateurs, vous compris, devront l&apos;accepter.</FieldDescription>
        )}
      </Field>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ink" size="pill" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Megaphone data-icon="inline-start" />}
            Publier la version {nextVersion}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publier la version {nextVersion} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;accès aux données sera bloqué pour chaque utilisateur jusqu&apos;à ce qu&apos;il accepte cette nouvelle version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => form?.requestSubmit()}>Publier</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
