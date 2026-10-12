"use client";

import { Building2, LoaderCircle, Lock, Save, User } from "lucide-react";
import { useActionState, useState } from "react";

import { saveClientAction, type ClientFormState } from "@/app/(app)/app/clients/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ClientFormValues = {
  id?: string;
  type: "ENTREPRISE" | "PARTICULIER";
  name: string;
  siret: string;
  vatNumber: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
  paymentTermsDays: string;
};

const TERMS = [
  { value: "0", label: "À réception" },
  { value: "15", label: "15 jours" },
  { value: "30", label: "30 jours" },
  { value: "45", label: "45 jours" },
  { value: "60", label: "60 jours" },
];

const inputClass = "h-11 rounded-xl bg-card px-3.5";

export function ClientForm({ initial }: { initial: ClientFormValues }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClientAction, {});
  const values = { ...initial, ...state.values } as ClientFormValues;
  const [type, setType] = useState<ClientFormValues["type"]>(initial.type);
  const error = (name: string) => state.errors?.[name];

  const text = (name: keyof ClientFormValues, label: string, props: React.ComponentProps<"input"> = {}, hint?: string) => (
    <Field data-invalid={Boolean(error(name)) || undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        defaultValue={values[name]}
        aria-invalid={Boolean(error(name)) || undefined}
        className={inputClass}
        {...props}
      />
      {error(name) ? <FieldError>{error(name)}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  );

  return (
    <form action={action} className="space-y-8" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />

      <fieldset className="surface space-y-6 p-6">
        <legend className="sr-only">Identité</legend>
        <h2 className="label-mono text-muted-foreground">Identité</h2>
        <div className="grid grid-cols-2 gap-2 sm:max-w-md" role="radiogroup" aria-label="Type de client">
          {(
            [
              ["ENTREPRISE", "Entreprise", Building2],
              ["PARTICULIER", "Particulier", User],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                type === value ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <Icon className="size-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {text("name", type === "ENTREPRISE" ? "Raison sociale" : "Nom complet", { autoComplete: "organization" })}
          {type === "ENTREPRISE" && (
            <>
              {text("siret", "SIRET", { inputMode: "numeric", placeholder: "000 000 000 00000" }, "14 chiffres, clé de contrôle vérifiée.")}
              {text("vatNumber", "N° de TVA intracommunautaire", { placeholder: "FR00000000000" }, "Facultatif.")}
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="surface space-y-6 p-6">
        <legend className="sr-only">Coordonnées</legend>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="label-mono text-muted-foreground">Coordonnées de facturation</h2>
          <span className="label-mono flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.6rem] text-muted-foreground">
            <Lock className="size-3" /> Chiffrées AES-256-GCM
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {text("email", "E-mail de facturation", { type: "email", autoComplete: "off", placeholder: "compta@entreprise.fr" })}
          {text("phone", "Téléphone", { type: "tel", autoComplete: "off", placeholder: "01 23 45 67 89" })}
          {text("line1", "Adresse", { autoComplete: "off" })}
          {text("line2", "Complément d'adresse", { autoComplete: "off" }, "Facultatif.")}
          <div className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3">
            {text("postalCode", "Code postal", { inputMode: "numeric", maxLength: 5 })}
            {text("city", "Ville")}
          </div>
          {text("country", "Pays")}
        </div>
        <p className="text-xs text-muted-foreground">
          Minimisation des données : seuls les champs nécessaires à la facturation sont collectés.
        </p>
      </fieldset>

      <fieldset className="surface space-y-4 p-6">
        <legend className="sr-only">Conditions</legend>
        <h2 className="label-mono text-muted-foreground">Conditions de paiement</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Délai de paiement">
          {TERMS.map((term) => (
            <label
              key={term.value}
              className="cursor-pointer rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors has-checked:border-foreground has-checked:bg-foreground has-checked:text-background"
            >
              <input
                type="radio"
                name="paymentTermsDays"
                value={term.value}
                defaultChecked={values.paymentTermsDays === term.value}
                className="sr-only"
              />
              {term.label}
            </label>
          ))}
        </div>
        <FieldDescription>Délai légal maximal entre professionnels : 60 jours (article L441-10 du Code de commerce).</FieldDescription>
      </fieldset>

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <div className="flex justify-end">
        <Button type="submit" variant="brand" size="xl" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          {initial.id ? "Enregistrer les modifications" : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
