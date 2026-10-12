"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useActionState, useState } from "react";

import { loginAction, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, type Role } from "@/lib/roles";

import { FormAlert } from "./form-alert";

type DemoAccount = { email: string; name: string; role: Role };

export function LoginForm({ demo }: { demo?: { accounts: DemoAccount[]; password: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState(state.fields?.email ?? "");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-8" noValidate>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="prenom@entreprise.fr"
              className="h-12 rounded-xl bg-card px-4 text-base"
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <span className="label-mono text-[0.6rem] text-muted-foreground">12 caractères min.</span>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl bg-card px-4 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
        </FieldGroup>

        {state.error && <FormAlert>{state.error}</FormAlert>}

        <Button type="submit" variant="brand" size="xl" className="w-full justify-between" disabled={pending}>
          <span className="flex items-center gap-2">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
            {pending ? "Vérification…" : "Se connecter"}
          </span>
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>

      {demo && (
        <section aria-labelledby="demo-title" className="rounded-2xl border border-dashed border-border p-4">
          <h2 id="demo-title" className="label-mono text-muted-foreground">
            Démonstration · un compte par rôle
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {demo.accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(demo.password);
                }}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/30"
              >
                <span className="block text-sm font-medium">{ROLE_LABELS[account.role]}</span>
                <span className="block truncate text-xs text-muted-foreground">{account.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Cliquez sur un rôle pour remplir le formulaire. Toutes les données sont fictives.
          </p>
        </section>
      )}
    </div>
  );
}
