"use client";

import { Copy, KeyRound, LoaderCircle, Power, UserPlus } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  changeRoleAction,
  createUserAction,
  resetMfaAction,
  setDisabledAction,
  type CreateUserState,
} from "@/app/(app)/app/admin/utilisateurs/actions";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles";

function report(result: { error?: string }, success: string): void {
  if (result.error) toast.error(result.error);
  else toast.success(success);
}

export function RoleSelect({ userId, role, locked }: { userId: string; role: Role; locked: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={role}
      disabled={locked || pending}
      onValueChange={(value) =>
        startTransition(async () => report(await changeRoleAction(userId, value as Role), "Rôle modifié"))
      }
    >
      <SelectTrigger aria-label="Rôle" className="h-9 w-40 rounded-full bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((value) => (
          <SelectItem key={value} value={value}>
            {ROLE_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UserRowActions({ userId, name, disabled, locked }: { userId: string; name: string; disabled: boolean; locked: boolean }) {
  const [pending, startTransition] = useTransition();
  if (locked) return <span className="text-xs text-muted-foreground">Protégé</span>;
  return (
    <div className="flex justify-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Réinitialiser la double authentification de ${name}`} disabled={pending}>
            <KeyRound />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la double authentification ?</AlertDialogTitle>
            <AlertDialogDescription>
              À utiliser si {name} a perdu son téléphone. Ses sessions sont fermées et ses codes de secours supprimés ; il
              réactivera la 2FA à sa prochaine connexion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => startTransition(async () => report(await resetMfaAction(userId), "Double authentification réinitialisée"))}
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={disabled ? `Réactiver ${name}` : `Désactiver ${name}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () =>
            report(await setDisabledAction(userId, !disabled), disabled ? "Compte réactivé" : "Compte désactivé, sessions fermées"),
          )
        }
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Power className={disabled ? "text-electric" : "text-destructive"} />}
      </Button>
    </div>
  );
}

export function CreateUserDialog() {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUserAction, {});
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // Le mot de passe provisoire n'est montré qu'une fois : fermer la fenêtre le masque définitivement.
  const [dismissed, setDismissed] = useState<CreateUserState["created"]>(undefined);
  const showCreated = state.created && state.created !== dismissed;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setDismissed(state.created);
          setFormKey((key) => key + 1);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="brand" size="pill">
          <UserPlus data-icon="inline-start" />
          Nouvel utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>Un compte personnel par personne : aucun compte partagé.</DialogDescription>
        </DialogHeader>
        {showCreated && state.created ? (
          <CreatedUser created={state.created} />
        ) : (
          <form key={formKey} action={action} className="space-y-4" noValidate>
            <Field data-invalid={Boolean(state.errors?.name) || undefined}>
              <FieldLabel htmlFor="new-name">Nom complet</FieldLabel>
              <Input id="new-name" name="name" required className="h-11 rounded-xl" />
              {state.errors?.name && <FieldError>{state.errors.name}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(state.errors?.email) || undefined}>
              <FieldLabel htmlFor="new-email">Adresse e-mail professionnelle</FieldLabel>
              <Input id="new-email" name="email" type="email" required className="h-11 rounded-xl" />
              {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="new-role">Rôle</FieldLabel>
              <Select name="role" defaultValue="LECTEUR">
                <SelectTrigger id="new-role" className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {state.error && <FormAlert>{state.error}</FormAlert>}
            <Button type="submit" variant="ink" size="xl" className="w-full" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
              Créer le compte
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedUser({ created }: { created: NonNullable<CreateUserState["created"]> }) {
  return (
    <div className="space-y-4">
      <FormAlert tone="info">
        Compte créé pour {created.name}. Transmettez ce mot de passe provisoire par un canal séparé : il ne sera plus affiché.
      </FormAlert>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <code className="font-mono text-sm break-all">{created.temporaryPassword}</code>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copier le mot de passe provisoire"
          onClick={async () => {
            await navigator.clipboard.writeText(created.temporaryPassword);
            toast.success("Copié");
          }}
        >
          <Copy />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        À sa première connexion, {created.email} devra choisir son propre mot de passe puis activer la double authentification.
      </p>
    </div>
  );
}
