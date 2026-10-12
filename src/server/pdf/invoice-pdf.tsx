import "server-only";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatDate, formatDateTime, formatEUR } from "@/lib/format";
import { formatQuantity, VAT_RATE_LABELS, type VatRateBp } from "@/lib/invoice-math";
import { formatSiretDisplay, legalFooter, paymentMentions } from "@/lib/invoice-mentions";

import type { InvoiceView } from "../invoices/queries";

const INK = "#0e0f13";
const MUTED = "#5b5f74";
const LINE = "#dcdeea";
const PAPER = "#f0f1fa";

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  watermark: {
    position: "absolute",
    top: 380,
    left: -40,
    width: 680,
    textAlign: "center",
    transform: "rotate(-32deg)",
    fontSize: 15,
    color: "#1a2ffb",
    opacity: 0.09,
    fontFamily: "Helvetica-Bold",
  },
  draft: { position: "absolute", top: 300, left: 0, width: 595, textAlign: "center", fontSize: 80, opacity: 0.05, transform: "rotate(-24deg)", fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between" },
  company: { fontFamily: "Helvetica-Bold", fontSize: 18, letterSpacing: -0.5 },
  muted: { color: MUTED },
  label: { fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED },
  number: { fontFamily: "Courier-Bold", fontSize: 13, marginTop: 3 },
  billTo: { marginTop: 28, padding: 14, backgroundColor: PAPER, borderRadius: 8, width: 250 },
  table: { marginTop: 28 },
  th: { flexDirection: "row", borderBottomWidth: 1.2, borderBottomColor: INK, paddingBottom: 6 },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: LINE, paddingVertical: 8 },
  colDesignation: { flex: 1, paddingRight: 8 },
  colQty: { width: 44, textAlign: "right" },
  colPrice: { width: 78, textAlign: "right" },
  colVat: { width: 44, textAlign: "right" },
  colTotal: { width: 84, textAlign: "right" },
  mono: { fontFamily: "Courier" },
  totals: { marginTop: 16, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: INK, marginTop: 6, paddingTop: 8 },
  notes: { marginTop: 20, padding: 10, borderWidth: 0.6, borderColor: LINE, borderRadius: 6 },
  mentions: { marginTop: 26, paddingTop: 12, borderTopWidth: 0.6, borderTopColor: LINE, flexDirection: "row", gap: 24, fontSize: 7.8, color: MUTED, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#8e95b5" },
});

export function InvoicePdf({
  invoice,
  exportedBy,
  exportedAt,
}: {
  invoice: NonNullable<InvoiceView>;
  exportedBy: string;
  exportedAt: Date;
}) {
  const { seller, clientView: client } = invoice;
  const watermark = `CONFIDENTIEL · ${exportedBy} · ${formatDateTime(exportedAt)}`;
  const mentions = paymentMentions({
    seller,
    paymentTermsDays: invoice.paymentTermsDays,
    clientIsCompany: client.type === "ENTREPRISE",
    hasZeroVat: invoice.lines.some((line) => line.vatRateBp === 0),
  });

  return (
    <Document
      title={invoice.number ?? "Brouillon de facture"}
      author={seller.companyName}
      subject={`Facture ${invoice.number ?? "(brouillon)"} · ${client.name}`}
      creator="Vault Facturation"
      producer="Vault Facturation"
      language="fr-FR"
    >
      <Page size="A4" style={styles.page}>
        {!invoice.number && (
          <Text style={styles.draft} fixed>
            BROUILLON
          </Text>
        )}
        {/* Filigrane discret, répété sur chaque page : qui a exporté, et quand. */}
        {[0, 1, 2].map((index) => (
          <Text key={index} style={[styles.watermark, { top: 170 + index * 230 }]} fixed>
            {watermark}
          </Text>
        ))}

        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{seller.companyName}</Text>
            <Text style={[styles.muted, { marginTop: 6, lineHeight: 1.45 }]}>
              {[
                [seller.address.line1, seller.address.line2].filter(Boolean).join(", "),
                `${seller.address.postalCode} ${seller.address.city}`,
                `${seller.email} · ${seller.phone}`,
              ].join("\n")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Facture</Text>
            <Text style={styles.number}>{invoice.number ?? "BROUILLON"}</Text>
            <View style={{ marginTop: 8 }}>
              {[
                ["Date d'émission", invoice.issueDate ? formatDate(invoice.issueDate) : "—"],
                ["Date de prestation", invoice.serviceDate ? formatDate(invoice.serviceDate) : "—"],
                ["Échéance", formatDate(invoice.dueDate)],
              ].map(([label, value]) => (
                <View key={label} style={[styles.row, { justifyContent: "flex-end", marginTop: 2 }]}>
                  <Text style={[styles.muted, { marginRight: 10 }]}>{label}</Text>
                  <Text style={styles.mono}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.billTo}>
          <Text style={styles.label}>Facturé à</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 5 }}>{client.name}</Text>
          {client.address && (
            <Text style={[styles.muted, { lineHeight: 1.45 }]}>
              {[
                [client.address.line1, client.address.line2].filter(Boolean).join(", "),
                `${client.address.postalCode} ${client.address.city}`,
              ].join("\n")}
            </Text>
          )}
          {client.siret && <Text style={[styles.muted, styles.mono, { marginTop: 4, fontSize: 8 }]}>SIRET {formatSiretDisplay(client.siret)}</Text>}
          {client.vatNumber && <Text style={[styles.muted, styles.mono, { fontSize: 8 }]}>TVA {client.vatNumber}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.label, styles.colDesignation]}>Désignation</Text>
            <Text style={[styles.label, styles.colQty]}>Qté</Text>
            <Text style={[styles.label, styles.colPrice]}>PU HT</Text>
            <Text style={[styles.label, styles.colVat]}>TVA</Text>
            <Text style={[styles.label, styles.colTotal]}>Total HT</Text>
          </View>
          {invoice.lines.map((line) => (
            <View key={line.id} style={styles.tr} wrap={false}>
              <Text style={styles.colDesignation}>{line.designation}</Text>
              <Text style={[styles.colQty, styles.mono]}>{formatQuantity(line.quantityMilli)}</Text>
              <Text style={[styles.colPrice, styles.mono]}>{formatEUR(line.unitPriceCents)}</Text>
              <Text style={[styles.colVat, styles.mono]}>{VAT_RATE_LABELS[line.vatRateBp as VatRateBp]}</Text>
              <Text style={[styles.colTotal, styles.mono]}>{formatEUR(line.totalHtCents)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Total HT</Text>
            <Text style={styles.mono}>{formatEUR(invoice.totalHtCents)}</Text>
          </View>
          {invoice.vatBreakdown.map((row) => (
            <View key={row.vatRateBp} style={styles.totalRow}>
              <Text style={styles.muted}>
                TVA {VAT_RATE_LABELS[row.vatRateBp as VatRateBp]} sur {formatEUR(row.baseHtCents)}
              </Text>
              <Text style={styles.mono}>{formatEUR(row.vatCents)}</Text>
            </View>
          ))}
          <View style={styles.grandTotal}>
            <Text style={styles.label}>Total TTC</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>{formatEUR(invoice.totalTtcCents)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.mentions} wrap={false}>
          <View style={{ width: 180 }}>
            <Text style={[styles.label, { color: INK, marginBottom: 4 }]}>Règlement par virement</Text>
            <Text style={styles.mono}>IBAN {seller.iban}</Text>
            <Text style={styles.mono}>BIC {seller.bic}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {mentions.map((mention) => (
              <Text key={mention}>{mention}</Text>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ flex: 1, paddingRight: 12 }}>{legalFooter(seller)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
