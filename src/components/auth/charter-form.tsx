"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { acceptCharterAction, type FormState } from "@/app/(auth)/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { FormAlert } from "./form-alert";

/** Acceptation de la charte : le bouton se « charge » quand la case est cochée. */
export function CharterForm({ versionId }: { versionId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptCharterAction, {});
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="versionId" value={versionId} />
      <label
        htmlFor="accept"
        className={cn(
          "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-colors duration-300",
          accepted ? "border-brand/60 bg-brand/[0.06]" : "border-white/12 hover:border-white/25",
        )}
      >
        <Checkbox
          id="accept"
          name="accept"
          checked={accepted}
          onCheckedChange={(value) => setAccepted(value === true)}
          className="mt-0.5 size-5 border-white/40 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground"
        />
        <span className="text-lg text-white">J&apos;ai lu et j&apos;accepte la charte de confidentialité.</span>
      </label>

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <button
        type="submit"
        disabled={!accepted || pending}
        aria-disabled={!accepted || pending}
        className="group relative flex h-14 w-full items-center justify-between overflow-hidden rounded-full border border-white/15 px-6 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed enabled:text-brand-foreground"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-left bg-brand transition-transform duration-700 ease-(--ease-vault)",
            accepted ? "scale-x-100" : "scale-x-0",
          )}
        />
        <span className="relative flex items-center gap-2">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Accéder à l&apos;espace confidentiel
        </span>
        <ArrowRight className="relative size-5 transition-transform group-enabled:group-hover:translate-x-1" />
      </button>
    </form>
  );
}
