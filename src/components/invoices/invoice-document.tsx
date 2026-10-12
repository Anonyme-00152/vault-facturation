import { formatDate, formatEUR } from "@/lib/format";
import { formatQuantity, VAT_RATE_LABELS, type VatRateBp } from "@/lib/invoice-math";
import { formatSiretDisplay, legalFooter, paymentMentions } from "@/lib/invoice-mentions";
import type { InvoiceView } from "@/server/invoices/queries";

/** Aperçu « papier » de la facture : toujours sur fond blanc, comme le document final. */
export function InvoiceDocument({ invoice }: { invoice: NonNullable<InvoiceView> }) {
  const { seller, clientView: client } = invoice;
  const mentions = paymentMentions({
    seller,
    paymentTermsDays: invoice.paymentTermsDays,
    clientIsCompany: client.type === "ENTREPRISE",
    hasZeroVat: invoice.lines.some((line) => line.vatRateBp === 0),
  });

  return (
    <article className="relative overflow-hidden rounded-3xl bg-white p-6 text-[#0e0f13] shadow-[0_30px_80px_-40px_rgb(14_15_19/0.35)] ring-1 ring-[#dcdeea] sm:p-10">
      {!invoice.number && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] font-display text-[clamp(4rem,12vw,9rem)] whitespace-nowrap text-[#0e0f13]/[0.04]"
        >
          BROUILLON
        </span>
      )}

      <header className="flex flex-col justify-between gap-8 sm:flex-row">
        <div>
          <p className="font-display text-2xl">{seller.companyName}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5f74]">
            {seller.address.line1}
            {seller.address.line2 && <>, {seller.address.line2}</>}
            <br />
            {seller.address.postalCode} {seller.address.city}
            <br />
            {seller.email} · {seller.phone}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="label-mono text-[#5b5f74]">Facture</p>
          <p className="mt-1 font-mono text-xl font-medium">{invoice.number ?? "Brouillon non numéroté"}</p>
          <dl className="mt-3 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-1 text-sm sm:justify-end">
            <dt className="text-[#5b5f74]">Date d&apos;émission</dt>
            <dd className="font-mono">{invoice.issueDate ? formatDate(invoice.issueDate) : "—"}</dd>
            <dt className="text-[#5b5f74]">Date de prestation</dt>
            <dd className="font-mono">{invoice.serviceDate ? formatDate(invoice.serviceDate) : "—"}</dd>
            <dt className="text-[#5b5f74]">Échéance</dt>
            <dd className="font-mono">{formatDate(invoice.dueDate)}</dd>
          </dl>
        </div>
      </header>

      <section className="mt-10 rounded-2xl bg-[#f0f1fa] p-5 sm:max-w-sm">
        <p className="label-mono text-[#5b5f74]">Facturé à</p>
        <p className="mt-2 font-medium">{client.name}</p>
        {client.address && (
          <p className="text-sm leading-relaxed text-[#5b5f74]">
            {client.address.line1}
            {client.address.line2 && <>, {client.address.line2}</>}
            <br />
            {client.address.postalCode} {client.address.city}
          </p>
        )}
        {client.siret && <p className="mt-2 font-mono text-xs text-[#5b5f74]">SIRET {formatSiretDisplay(client.siret)}</p>}
        {client.vatNumber && <p className="font-mono text-xs text-[#5b5f74]">TVA {client.vatNumber}</p>}
      </section>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-[#0e0f13] text-left">
              <th className="label-mono py-3 pr-4 font-medium text-[#5b5f74]">Désignation</th>
              <th className="label-mono py-3 pr-4 text-right font-medium text-[#5b5f74]">Qté</th>
              <th className="label-mono py-3 pr-4 text-right font-medium text-[#5b5f74]">PU HT</th>
              <th className="label-mono py-3 pr-4 text-right font-medium text-[#5b5f74]">TVA</th>
              <th className="label-mono py-3 text-right font-medium text-[#5b5f74]">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-[#dcdeea]">
                <td className="py-3.5 pr-4">{line.designation}</td>
                <td className="py-3.5 pr-4 text-right font-mono tabular">{formatQuantity(line.quantityMilli)}</td>
                <td className="py-3.5 pr-4 text-right font-mono tabular">{formatEUR(line.unitPriceCents)}</td>
                <td className="py-3.5 pr-4 text-right font-mono tabular">{VAT_RATE_LABELS[line.vatRateBp as VatRateBp]}</td>
                <td className="py-3.5 text-right font-mono tabular">{formatEUR(line.totalHtCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#5b5f74]">Total HT</dt>
            <dd className="font-mono tabular">{formatEUR(invoice.totalHtCents)}</dd>
          </div>
          {invoice.vatBreakdown.map((row) => (
            <div key={row.vatRateBp} className="flex justify-between">
              <dt className="text-[#5b5f74]">TVA {VAT_RATE_LABELS[row.vatRateBp as VatRateBp]}</dt>
              <dd className="font-mono tabular">{formatEUR(row.vatCents)}</dd>
            </div>
          ))}
          <div className="flex items-end justify-between border-t-2 border-[#0e0f13] pt-3">
            <dt className="label-mono">Total TTC</dt>
            <dd className="font-display text-2xl tabular">{formatEUR(invoice.totalTtcCents)}</dd>
          </div>
        </dl>
      </div>

      {invoice.notes && <p className="mt-8 rounded-2xl border border-[#dcdeea] p-4 text-sm">{invoice.notes}</p>}

      <section className="mt-10 grid gap-6 border-t border-[#dcdeea] pt-6 text-xs leading-relaxed text-[#5b5f74] sm:grid-cols-2">
        <div>
          <p className="label-mono mb-2 text-[#0e0f13]">Règlement par virement</p>
          <p className="font-mono">IBAN {seller.iban}</p>
          <p className="font-mono">BIC {seller.bic}</p>
        </div>
        <ul className="space-y-1">
          {mentions.map((mention) => (
            <li key={mention}>{mention}</li>
          ))}
        </ul>
      </section>
      <p className="mt-6 text-[0.7rem] text-[#8e95b5]">{legalFooter(seller)}</p>
    </article>
  );
}
