import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createElement } from "react";

import { audit } from "@/server/audit";
import { actorOf, requireApiAccess } from "@/server/auth/guard";
import { getInvoice } from "@/server/invoices/queries";
import { InvoicePdf } from "@/server/pdf/invoice-pdf";
import { hit, RULES } from "@/server/rate-limit";

/** Export PDF d'une facture : permission dédiée, limité en débit, journalisé, filigrané. */
export async function GET(_: NextRequest, { params }: RouteContext<"/api/factures/[id]/pdf">) {
  const { user, response } = await requireApiAccess("invoices:export");
  if (response) return response;
  if ((await hit(`api:${user.id}`, RULES.apiPerUser)).blocked) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id } = await params;
  const invoice = /^[0-9a-f-]{36}$/.test(id) ? await getInvoice(id) : null;
  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const exportedAt = new Date();
  const buffer = await renderToBuffer(createElement(InvoicePdf, { invoice, exportedBy: user.name, exportedAt }) as never);
  await audit({
    action: "INVOICE_PDF_EXPORTED",
    actor: actorOf(user),
    entityType: "invoice",
    entityId: invoice.id,
    metadata: { numero: invoice.number ?? "brouillon" },
  });

  const filename = `${invoice.number ?? `brouillon-${invoice.id.slice(0, 8)}`}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
