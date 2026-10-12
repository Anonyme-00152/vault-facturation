import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { parisToday } from "@/lib/dates";
import { computeTotals } from "@/lib/invoice-math";

import { decryptClient, type ClientSnapshot } from "../clients/service";
import { decryptJson } from "../crypto";
import { db } from "../db";
import { getSettings, toSellerSnapshot, type SellerSnapshot } from "../settings";
import { clientSnapshotContext } from "./service";

export const INVOICES_PER_PAGE = 15;

export type InvoiceStatusFilter = "brouillons" | "envoyees" | "en-retard" | "payees";

export function parseInvoiceFilters(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const status = value("statut");
  const page = Number(value("page") ?? "1");
  return {
    q: value("q")?.trim().slice(0, 100) || undefined,
    status: (["brouillons", "envoyees", "en-retard", "payees"] as const).find((s) => s === status),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function statusWhere(status: InvoiceStatusFilter | undefined): Prisma.InvoiceWhereInput {
  const today = parisToday();
  switch (status) {
    case "brouillons":
      return { status: "DRAFT" };
    case "envoyees":
      return { status: "SENT", dueDate: { gte: today } };
    case "en-retard":
      return { status: "SENT", dueDate: { lt: today } };
    case "payees":
      return { status: "PAID" };
    default:
      return {};
  }
}

export async function listInvoices(filters: ReturnType<typeof parseInvoiceFilters>) {
  const q = filters.q;
  const where: Prisma.InvoiceWhereInput = {
    ...statusWhere(filters.status),
    ...(q
      ? {
          OR: [
            { number: { contains: q.toUpperCase() } },
            { client: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const page = filters.page;
  const [total, sums, invoices, counts] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.aggregate({ where, _sum: { totalTtcCents: true, totalHtCents: true } }),
    db.invoice.findMany({
      where,
      orderBy: [{ status: "asc" }, { issueDate: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      skip: (page - 1) * INVOICES_PER_PAGE,
      take: INVOICES_PER_PAGE,
      select: {
        id: true,
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        totalHtCents: true,
        totalTtcCents: true,
        client: { select: { id: true, name: true } },
      },
    }),
    Promise.all(
      (["brouillons", "envoyees", "en-retard", "payees"] as const).map(async (status) => [
        status,
        await db.invoice.count({ where: statusWhere(status) }),
      ]),
    ),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / INVOICES_PER_PAGE)),
    sumTtcCents: sums._sum.totalTtcCents ?? 0,
    sumHtCents: sums._sum.totalHtCents ?? 0,
    invoices,
    counts: Object.fromEntries(counts) as Record<InvoiceStatusFilter, number>,
  };
}

export type InvoiceView = Awaited<ReturnType<typeof getInvoice>>;

/**
 * Facture complète pour l'affichage et le PDF. Une facture émise est rendue à partir
 * de ses copies figées (client et vendeur) ; un brouillon, à partir des données courantes.
 */
export async function getInvoice(id: string) {
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { position: "asc" } },
      client: true,
      createdBy: { select: { name: true } },
    },
  });
  if (!invoice) return null;

  const client: ClientSnapshot & { email?: string | null } = invoice.clientSnapshotEnc
    ? decryptJson<ClientSnapshot>(invoice.clientSnapshotEnc, clientSnapshotContext(invoice.id))
    : (() => {
        const current = decryptClient(invoice.client);
        return { type: current.type, name: current.name, siret: current.siret, vatNumber: current.vatNumber, address: current.address };
      })();
  const seller: SellerSnapshot = (invoice.sellerSnapshot as SellerSnapshot | null) ?? toSellerSnapshot(await getSettings());
  const totals = computeTotals(invoice.lines);

  return {
    ...invoice,
    clientView: client,
    seller,
    vatBreakdown: totals.vatBreakdown,
    clientAnonymized: invoice.client.anonymizedAt !== null,
  };
}
