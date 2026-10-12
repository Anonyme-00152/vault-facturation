"use client";

import { GripVertical, LoaderCircle, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { saveDraftAction, type InvoiceFormState } from "@/app/(app)/app/factures/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEUR } from "@/lib/format";
import {
  computeTotals,
  lineTotalHt,
  parseEurosToCents,
  parseQuantityToMilli,
  VAT_RATE_LABELS,
  VAT_RATES_BP,
  type VatRateBp,
} from "@/lib/invoice-math";
import { cn } from "@/lib/utils";

type LineDraft = { key: string; designation: string; quantity: string; unitPrice: string; vatRateBp: string };

export type EditorInitial = {
  id?: string;
  clientId: string;
  serviceDate: string;
  dueInDays: string;
  notes: string;
  lines: Omit<LineDraft, "key">[];
};

type ClientOption = { id: string; name: string; type: string; paymentTermsDays: number };
type Suggestion = { designation: string; unitPrice: string; vatRateBp: number };

const TERMS = [0, 15, 30, 45, 60];
const newKey = () => crypto.randomUUID();
const emptyLine = (): LineDraft => ({ key: newKey(), designation: "", quantity: "1", unitPrice: "", vatRateBp: "2000" });

function parsedLine(line: LineDraft) {
  const quantityMilli = parseQuantityToMilli(line.quantity);
  const unitPriceCents = parseEurosToCents(line.unitPrice);
  if (quantityMilli === null || unitPriceCents === null) return null;
  return { quantityMilli, unitPriceCents, vatRateBp: Number(line.vatRateBp) };
}

export function InvoiceEditor({
  initial,
  clients,
  suggestions,
}: {
  initial: EditorInitial;
  clients: ClientOption[];
  suggestions: Suggestion[];
}) {
  const [state, action, pending] = useActionState<InvoiceFormState, FormData>(saveDraftAction, {});
  const [clientId, setClientId] = useState(initial.clientId);
  const [dueInDays, setDueInDays] = useState(initial.dueInDays);
  const [lines, setLines] = useState<LineDraft[]>(() =>
    initial.lines.length ? initial.lines.map((line) => ({ ...line, key: newKey() })) : [emptyLine()],
  );

  const totals = useMemo(() => computeTotals(lines.map(parsedLine).filter((line) => line !== null)), [lines]);
  const error = (key: string) => state.errors?.[key];
  const update = (key: string, patch: Partial<LineDraft>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(lines.map(({ designation, quantity, unitPrice, vatRateBp }) => ({ designation, quantity, unitPrice, vatRateBp })))}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <section className="surface grid gap-5 p-6 md:grid-cols-3">
          <Field className="md:col-span-3" data-invalid={Boolean(error("clientId")) || undefined}>
            <FieldLabel htmlFor="clientId">Client</FieldLabel>
            <Select
              name="clientId"
              value={clientId}
              onValueChange={(value) => {
                setClientId(value);
                const client = clients.find((option) => option.id === value);
                if (client) setDueInDays(String(client.paymentTermsDays));
              }}
            >
              <SelectTrigger id="clientId" className="h-11 w-full rounded-xl bg-card">
                <SelectValue placeholder="Choisir un client…" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    <span className="text-muted-foreground"> · {client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error("clientId") && <FieldError>{error("clientId")}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="serviceDate">Date de la prestation</FieldLabel>
            <Input id="serviceDate" name="serviceDate" type="date" defaultValue={initial.serviceDate} className="h-11 rounded-xl bg-card" />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>Délai de paiement</FieldLabel>
            <input type="hidden" name="dueInDays" value={dueInDays} />
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Délai de paiement">
              {TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  role="radio"
                  aria-checked={dueInDays === String(term)}
                  onClick={() => setDueInDays(String(term))}
                  className={cn(
                    "h-11 rounded-xl border px-3.5 text-sm transition-colors",
                    dueInDays === String(term) ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  {term === 0 ? "À réception" : `${term} j`}
                </button>
              ))}
            </div>
          </Field>
        </section>

        <section className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <h2 className="label-mono text-muted-foreground">Lignes de facture</h2>
            <span className="label-mono text-[0.6rem] text-muted-foreground">Prix unitaires hors taxes</span>
          </div>

          <div className="hidden grid-cols-[1.25rem_minmax(0,1fr)_5rem_7rem_6.5rem_7rem_2.25rem] gap-2 px-6 pb-2 text-xs text-muted-foreground lg:grid">
            <span />
            <span>Désignation</span>
            <span>Qté</span>
            <span>Prix HT</span>
            <span>TVA</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>

          <ol className="flex flex-col gap-3 px-4 pb-4 lg:gap-1.5 lg:px-6">
            {lines.map((line, index) => {
              const parsed = parsedLine(line);
              return (
                <li
                  key={line.key}
                  className="grid grid-cols-2 gap-2 rounded-2xl border border-border p-3 lg:grid-cols-[1.25rem_minmax(0,1fr)_5rem_7rem_6.5rem_7rem_2.25rem] lg:items-center lg:rounded-none lg:border-0 lg:p-0"
                >
                  <GripVertical className="hidden size-4 text-muted-foreground/50 lg:block" aria-hidden />
                  <div className="col-span-2 lg:col-span-1">
                    <Input
                      aria-label={`Désignation de la ligne ${index + 1}`}
                      value={line.designation}
                      onChange={(event) => update(line.key, { designation: event.target.value })}
                      placeholder="Développement front-end (jour)"
                      aria-invalid={Boolean(error(`lines.${index}.designation`)) || undefined}
                      className="h-10 rounded-lg bg-card"
                    />
                  </div>
                  <Input
                    aria-label={`Quantité de la ligne ${index + 1}`}
                    value={line.quantity}
                    inputMode="decimal"
                    onChange={(event) => update(line.key, { quantity: event.target.value })}
                    aria-invalid={Boolean(error(`lines.${index}.quantity`)) || (line.quantity !== "" && parseQuantityToMilli(line.quantity) === null) || undefined}
                    className="h-10 rounded-lg bg-card font-mono"
                  />
                  <div className="relative">
                    <Input
                      aria-label={`Prix unitaire HT de la ligne ${index + 1}`}
                      value={line.unitPrice}
                      inputMode="decimal"
                      placeholder="0,00"
                      onChange={(event) => update(line.key, { unitPrice: event.target.value })}
                      aria-invalid={Boolean(error(`lines.${index}.unitPrice`)) || (line.unitPrice !== "" && parseEurosToCents(line.unitPrice) === null) || undefined}
                      className="h-10 rounded-lg bg-card pr-7 font-mono"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                  <Select value={line.vatRateBp} onValueChange={(value) => update(line.key, { vatRateBp: value })}>
                    <SelectTrigger aria-label={`TVA de la ligne ${index + 1}`} className="h-10 w-full rounded-lg bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES_BP.map((rate) => (
                        <SelectItem key={rate} value={String(rate)}>
                          {VAT_RATE_LABELS[rate as VatRateBp]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-right font-mono text-sm tabular">{parsed ? formatEUR(lineTotalHt(parsed)) : "—"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la ligne ${index + 1}`}
                    disabled={lines.length === 1}
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                    className="justify-self-end"
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-2 border-t border-border p-4 lg:px-6">
            <Button type="button" variant="outline" size="pill" className="rounded-full" onClick={() => setLines((current) => [...current, emptyLine()])}>
              <Plus data-icon="inline-start" />
              Ajouter une ligne
            </Button>
            <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" /> Prestations fréquentes :
            </span>
            {suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion.designation}
                type="button"
                onClick={() =>
                  setLines((current) => [
                    ...current.filter((line) => line.designation || line.unitPrice),
                    { ...emptyLine(), designation: suggestion.designation, unitPrice: suggestion.unitPrice, vatRateBp: String(suggestion.vatRateBp) },
                  ])
                }
                className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs hover:border-foreground/40"
              >
                {suggestion.designation}
              </button>
            ))}
          </div>
        </section>

        <section className="surface p-6">
          <Field>
            <FieldLabel htmlFor="notes">Conditions particulières</FieldLabel>
            <Textarea id="notes" name="notes" defaultValue={initial.notes} rows={3} maxLength={500} placeholder="Référence de commande, modalités spécifiques…" className="rounded-xl bg-card" />
          </Field>
        </section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24">
        <section className="rounded-3xl bg-ink p-6 text-paper dark:bg-plum">
          <h2 className="label-mono text-paper/60">Totaux</h2>
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-paper/70">Total HT</dt>
              <dd className="font-mono tabular">{formatEUR(totals.totalHtCents)}</dd>
            </div>
            {totals.vatBreakdown.map((row) => (
              <div key={row.vatRateBp} className="flex justify-between">
                <dt className="text-paper/70">
                  TVA {VAT_RATE_LABELS[row.vatRateBp as VatRateBp]} <span className="text-paper/45">sur {formatEUR(row.baseHtCents)}</span>
                </dt>
                <dd className="font-mono tabular">{formatEUR(row.vatCents)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-end justify-between border-t border-paper/15 pt-5">
            <span className="label-mono text-paper/60">Total TTC</span>
            <span className="font-display text-3xl tabular text-brand">{formatEUR(totals.totalTtcCents)}</span>
          </div>
        </section>
        {state.error && <FormAlert>{state.error}</FormAlert>}
        {error("lines") && <FieldError>{error("lines")}</FieldError>}
        <Button type="submit" variant="brand" size="xl" disabled={pending || !clientId}>
          {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          Enregistrer le brouillon
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Un brouillon n&apos;a pas de numéro. Le numéro, continu et sans trou, est attribué à l&apos;émission ; la facture
          devient alors inaltérable.
        </p>
      </aside>
    </form>
  );
}
