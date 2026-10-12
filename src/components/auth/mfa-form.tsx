"use client";

import { ArrowRight, KeyRound, LoaderCircle, Smartphone } from "lucide-react";
import { useActionState, useState } from "react";

import { verifyMfaAction, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

import { FormAlert } from "./form-alert";

export function MfaForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyMfaAction, {});
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");

  return (
    <form action={action} className="space-y-7" noValidate>
      <input type="hidden" name="mode" value={mode} />

      {mode === "totp" ? (
        <Field>
          <FieldLabel htmlFor="code">Code à 6 chiffres</FieldLabel>
          <InputOTP
            id="code"
            name="code"
            maxLength={6}
            value={code}
            onChange={setCode}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            pattern="^[0-9]*$"
            containerClassName="justify-start"
          >
            <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:size-14 *:data-[slot=input-otp-slot]:rounded-xl *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:bg-card *:data-[slot=input-otp-slot]:font-mono *:data-[slot=input-otp-slot]:text-xl">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:size-14 *:data-[slot=input-otp-slot]:rounded-xl *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:bg-card *:data-[slot=input-otp-slot]:font-mono *:data-[slot=input-otp-slot]:text-xl">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="backup">Code de secours</FieldLabel>
          <Input
            id="backup"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCDE-23456"
            className="h-12 rounded-xl bg-card px-4 font-mono text-base tracking-widest uppercase"
          />
        </Field>
      )}

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Button
        type="submit"
        variant="brand"
        size="xl"
        className="w-full justify-between"
        disabled={pending || (mode === "totp" && code.length !== 6)}
      >
        <span className="flex items-center gap-2">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {pending ? "Vérification…" : "Valider"}
        </span>
        <ArrowRight data-icon="inline-end" />
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "totp" ? "backup" : "totp");
          setCode("");
        }}
        className="flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {mode === "totp" ? <KeyRound className="size-4" /> : <Smartphone className="size-4" />}
        {mode === "totp" ? "Téléphone indisponible ? Utiliser un code de secours" : "Utiliser l'application d'authentification"}
      </button>
    </form>
  );
}
