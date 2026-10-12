import "server-only";

import type { AuditAction, Prisma } from "@/generated/prisma/client";
import { AUDIT_LABELS } from "@/lib/audit-labels";
import { addDays, dateFromIso } from "@/lib/dates";

import { db } from "./db";

export const AUDIT_PER_PAGE = 25;

export type AuditFilters = { actor?: string; action?: AuditAction; from?: string; to?: string; page: number };

const isoDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);

export function parseAuditFilters(params: Record<string, string | string[] | undefined>): AuditFilters {
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const action = value("action");
  const actor = value("utilisateur");
  const page = Number(value("page") ?? "1");
  return {
    actor: actor === "systeme" || (actor && /^[0-9a-f-]{36}$/.test(actor)) ? actor : undefined,
    action: action && action in AUDIT_LABELS ? (action as AuditAction) : undefined,
    from: isoDate(value("du")),
    to: isoDate(value("au")),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function auditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  return {
    ...(filters.actor === "systeme" ? { actorId: null } : filters.actor ? { actorId: filters.actor } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.from || filters.to
      ? {
          at: {
            ...(filters.from ? { gte: dateFromIso(filters.from) } : {}),
            ...(filters.to ? { lt: addDays(dateFromIso(filters.to), 1) } : {}),
          },
        }
      : {}),
  };
}

export async function listAudit(filters: AuditFilters) {
  const where = auditWhere(filters);
  const [total, entries] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { seq: "desc" },
      skip: (filters.page - 1) * AUDIT_PER_PAGE,
      take: AUDIT_PER_PAGE,
    }),
  ]);
  return { total, entries, pages: Math.max(1, Math.ceil(total / AUDIT_PER_PAGE)) };
}

/** CSV (séparateur « ; » et BOM UTF-8 pour Excel en français), 10 000 lignes au plus. */
export async function auditCsv(filters: AuditFilters): Promise<{ csv: string; rows: number }> {
  const entries = await db.auditLog.findMany({ where: auditWhere(filters), orderBy: { seq: "asc" }, take: 10_000 });
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text; // neutralise l'injection de formules
    return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = ["rang", "date_utc", "utilisateur", "action", "libelle", "cible_type", "cible_id", "ip", "navigateur", "details", "empreinte", "empreinte_precedente"];
  const lines = entries.map((entry) =>
    [
      entry.seq,
      entry.at.toISOString(),
      entry.actorLabel ?? "système",
      entry.action,
      AUDIT_LABELS[entry.action],
      entry.entityType,
      entry.entityId,
      entry.ip,
      entry.userAgent,
      entry.metadata ? JSON.stringify(entry.metadata) : "",
      entry.hash,
      entry.prevHash,
    ]
      .map(escape)
      .join(";"),
  );
  return { csv: `﻿${[header.join(";"), ...lines].join("\r\n")}\r\n`, rows: entries.length };
}
