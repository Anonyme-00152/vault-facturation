import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { parisToday } from "@/lib/dates";

import { blindIndex } from "../crypto";
import { db } from "../db";
import { decryptClient } from "./service";

export const CLIENTS_PER_PAGE = 12;

export type ClientFilters = {
  q?: string;
  type?: "ENTREPRISE" | "PARTICULIER";
  status?: "actifs" | "anonymises" | "en-retard";
  page?: number;
};

export function parseClientFilters(params: Record<string, string | string[] | undefined>): ClientFilters {
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const type = value("type");
  const status = value("statut");
  const page = Number(value("page") ?? "1");
  return {
    q: value("q")?.trim().slice(0, 100) || undefined,
    type: type === "ENTREPRISE" || type === "PARTICULIER" ? type : undefined,
    status: status === "actifs" || status === "anonymises" || status === "en-retard" ? status : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * Recherche : par nom (sous-chaîne), par SIRET (préfixe), ou par email exact grâce
 * à l'index aveugle : l'email n'est jamais déchiffré pour chercher.
 */
function searchWhere(q: string | undefined): Prisma.ClientWhereInput {
  if (!q) return {};
  if (q.includes("@")) return { emailHash: blindIndex(q) };
  const digits = q.replace(/\s/g, "");
  if (/^\d{3,14}$/.test(digits)) return { siret: { startsWith: digits } };
  return { name: { contains: q, mode: "insensitive" } };
}

export async function listClients(filters: ClientFilters) {
  const today = parisToday();
  const where: Prisma.ClientWhereInput = {
    ...searchWhere(filters.q),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status === "anonymises" ? { anonymizedAt: { not: null } } : {}),
    ...(filters.status === "actifs" ? { anonymizedAt: null } : {}),
    ...(filters.status === "en-retard" ? { invoices: { some: { status: "SENT", dueDate: { lt: today } } } } : {}),
  };
  const page = filters.page ?? 1;

  const [total, rows] = await Promise.all([
    db.client.count({ where }),
    db.client.findMany({
      where,
      orderBy: [{ anonymizedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }],
      skip: (page - 1) * CLIENTS_PER_PAGE,
      take: CLIENTS_PER_PAGE,
    }),
  ]);

  const ids = rows.map((row) => row.id);
  const [outstanding, overdue, counts] = await Promise.all([
    db.invoice.groupBy({ by: ["clientId"], where: { clientId: { in: ids }, status: "SENT" }, _sum: { totalTtcCents: true } }),
    db.invoice.groupBy({ by: ["clientId"], where: { clientId: { in: ids }, status: "SENT", dueDate: { lt: today } }, _count: true }),
    db.invoice.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _count: true }),
  ]);
  const outstandingBy = new Map(outstanding.map((row) => [row.clientId, row._sum.totalTtcCents ?? 0]));
  const overdueBy = new Map(overdue.map((row) => [row.clientId, row._count]));
  const countBy = new Map(counts.map((row) => [row.clientId, row._count]));

  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / CLIENTS_PER_PAGE)),
    clients: rows.map((row) => {
      const client = decryptClient(row);
      return {
        id: client.id,
        type: client.type,
        name: client.name,
        siret: client.siret,
        city: client.address?.city ?? null,
        anonymized: client.anonymizedAt !== null,
        lastActivityAt: client.lastActivityAt,
        invoiceCount: countBy.get(client.id) ?? 0,
        outstandingCents: outstandingBy.get(client.id) ?? 0,
        overdueCount: overdueBy.get(client.id) ?? 0,
      };
    }),
  };
}

export async function getClient(id: string) {
  const row = await db.client.findUnique({ where: { id } });
  return row ? decryptClient(row) : null;
}

export async function getClientInvoices(clientId: string) {
  return db.invoice.findMany({
    where: { clientId },
    orderBy: [{ issueDate: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    select: { id: true, number: true, status: true, issueDate: true, dueDate: true, totalTtcCents: true },
  });
}

/** Clients pouvant être facturés (non anonymisés), pour les listes déroulantes. */
export async function billableClients() {
  return db.client.findMany({
    where: { anonymizedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, paymentTermsDays: true },
  });
}
