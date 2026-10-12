"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [visible, setVisible] = useState(false);

  return (
    <form
      className="space-y-8"
      method="post"
      noValidate
      onSubmit={(event) => {
        // Maquette : jamais d'envoi, et surtout jamais de mot de passe dans l'URL.
        event.preventDefault();
        toast.info("La connexion sera branchée à l'étape « Authentification ».");
      }}
    >
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
              minLength={12}
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

      <Button type="submit" variant="brand" size="xl" className="w-full justify-between">
        <span className="flex items-center gap-2">
          <LockKeyhole className="size-4" />
          Se connecter
        </span>
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
