"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { forcedPasswordAction, type FormState } from "@/app/(auth)/actions";
import { changePasswordAction } from "@/app/(app)/app/compte/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { passwordIssues, passwordScore } from "@/lib/validation";
import { cn } from "@/lib/utils";

import { FormAlert } from "./form-alert";

const SCORE_LABELS = ["Trop court", "Faible", "Correct", "Solide", "Excellent"];

export function PasswordForm({ mode, email, name }: { mode: "forced" | "account"; email: string; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "forced" ? forcedPasswordAction : changePasswordAction,
    {},
  );
  const [password, setPassword] = useState("");
  const score = passwordScore(password);
  const issues = password ? passwordIssues(password, { email, name }) : [];

  return (
    <form action={action} className="space-y-7" noValidate>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="current">{mode === "forced" ? "Mot de passe provisoire" : "Mot de passe actuel"}</FieldLabel>
          <Input id="current" name="current" type="password" autoComplete="current-password" required className="h-12 rounded-xl bg-card px-4" />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-xl bg-card px-4"
            aria-describedby="password-strength"
          />
          <div id="password-strength" className="space-y-2" aria-live="polite">
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full bg-muted transition-colors duration-300",
                    password && index < score && (score >= 3 ? "bg-brand" : score === 2 ? "bg-electric" : "bg-destructive"),
                  )}
                />
              ))}
            </div>
            <FieldDescription>
              {password ? `${SCORE_LABELS[score]}. ${issues[0] ?? ""}` : "12 caractères minimum. Évitez votre nom et votre e-mail."}
            </FieldDescription>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Confirmation</FieldLabel>
          <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required className="h-12 rounded-xl bg-card px-4" />
        </Field>
      </FieldGroup>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {mode === "account" && !state.error && state.fields?.ok && <FormAlert tone="info">Mot de passe modifié. Vos autres sessions ont été fermées.</FormAlert>}
      <Button type="submit" variant={mode === "forced" ? "brand" : "ink"} size="xl" className="w-full justify-between" disabled={pending}>
        <span className="flex items-center gap-2">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {mode === "forced" ? "Enregistrer et continuer" : "Changer le mot de passe"}
        </span>
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
