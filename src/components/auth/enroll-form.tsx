"use client";

import { ArrowRight, Check, Copy, Download, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { enrollMfaAction, type EnrollState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

import { FormAlert } from "./form-alert";

const slotGroup =
  "gap-2 *:data-[slot=input-otp-slot]:size-14 *:data-[slot=input-otp-slot]:rounded-xl *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:bg-card *:data-[slot=input-otp-slot]:font-mono *:data-[slot=input-otp-slot]:text-xl";

export function EnrollForm() {
  const [state, action, pending] = useActionState<EnrollState, FormData>(enrollMfaAction, {});
  const [code, setCode] = useState("");

  if (state.backupCodes) return <BackupCodes codes={state.backupCodes} next={state.next ?? "/app"} />;

  return (
    <form action={action} className="space-y-7" noValidate>
      <Field>
        <FieldLabel htmlFor="code">Code affiché par l&apos;application</FieldLabel>
        <InputOTP
          id="code"
          name="code"
          maxLength={6}
          value={code}
          onChange={setCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="^[0-9]*$"
          containerClassName="justify-start"
        >
          <InputOTPGroup className={slotGroup}>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup className={slotGroup}>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Field>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" variant="brand" size="xl" className="w-full justify-between" disabled={pending || code.length !== 6}>
        <span className="flex items-center gap-2">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Activer la double authentification
        </span>
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}

function BackupCodes({ codes, next }: { codes: string[]; next: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `Vault Facturation : codes de secours\nChaque code ne fonctionne qu'une fois.\n\n${codes.join("\n")}\n`;

  return (
    <div className="space-y-6">
      <FormAlert tone="info">
        Double authentification activée. Conservez ces 10 codes de secours en lieu sûr : ils ne seront plus jamais
        affichés.
      </FormAlert>
      <ol className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-4">
        {codes.map((code, index) => (
          <li key={code} className="flex items-center gap-3 font-mono text-sm tracking-wider">
            <span className="w-5 text-right text-xs text-muted-foreground">{index + 1}</span>
            {code}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="pill"
          className="rounded-full"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copiés" : "Copier"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="pill"
          className="rounded-full"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
            const link = Object.assign(document.createElement("a"), { href: url, download: "vault-codes-de-secours.txt" });
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download data-icon="inline-start" />
          Télécharger
        </Button>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox checked={saved} onCheckedChange={(value) => setSaved(value === true)} className="mt-0.5" />
        J&apos;ai mis ces codes en lieu sûr.
      </label>
      <Button type="button" variant="brand" size="xl" className="w-full justify-between" disabled={!saved} onClick={() => router.push(next)}>
        Continuer
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}
