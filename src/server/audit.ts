import "server-only";

import type { AuditAction, Prisma } from "@/generated/prisma/client";

import { db, type Tx } from "./db";
import { logger } from "./logger";
import { requestContext } from "./request-context";

export type AuditActor = { id: string; label: string } | null;

export type AuditEntry = {
  action: AuditAction;
  actor: AuditActor;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/** Clés jamais acceptées dans les métadonnées : aucune donnée personnelle de client dans le journal. */
const FORBIDDEN_KEYS = /mail|phone|t[ée]l[ée]phone|address|adresse|password|secret|code|iban|token|siret/i;

export function sanitizeMetadata(metadata: AuditEntry["metadata"]): Prisma.InputJsonObject | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_KEYS.test(key)) continue;
    clean[key] = typeof value === "string" ? value.slice(0, 200) : value;
  }
  return clean;
}

/**
 * Inscrit une action dans le journal (ajout seul, chaîné par la base).
 * Peut participer à une transaction : l'entrée n'existe que si l'action aboutit.
 */
export async function audit(entry: AuditEntry, tx?: Tx): Promise<void> {
  const context = await requestContext();
  const client = tx ?? db;
  try {
    await client.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor?.id ?? null,
        actorLabel: entry.actor?.label ?? null,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: sanitizeMetadata(entry.metadata),
      },
    });
  } catch (error) {
    // Une action sensible ne doit jamais aboutir sans trace : on propage l'erreur.
    logger.error({ action: entry.action, err: error }, "Échec d'écriture du journal d'audit");
    throw error;
  }
}

export type AuditIntegrity = { checked: number; firstBrokenId: string | null };

/** Recalcule toute la chaîne d'empreintes en base et renvoie la première entrée altérée. */
export async function verifyAuditChain(): Promise<AuditIntegrity> {
  const rows = await db.$queryRaw<{ checked: bigint; first_broken: bigint | null }[]>`
    WITH chain AS (
      SELECT id,
             hash = encode(digest(audit_log_canonical(a), 'sha256'), 'hex') AS hash_ok,
             prev_hash = coalesce(lag(hash) OVER (ORDER BY seq), prev_hash) AS link_ok
        FROM audit_log a
    )
    SELECT count(*) AS checked,
           min(id) FILTER (WHERE NOT hash_ok OR NOT link_ok) AS first_broken
      FROM chain`;
  const row = rows[0];
  return {
    checked: Number(row?.checked ?? 0),
    firstBrokenId: row?.first_broken != null ? String(row.first_broken) : null,
  };
}
