"use server";

import { audit, verifyAuditChain, type AuditIntegrity } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";

export async function verifyAuditAction(): Promise<AuditIntegrity & { verifiedAt: string }> {
  const user = await requireAccess("audit:read");
  const result = await verifyAuditChain();
  await audit({
    action: "AUDIT_VERIFIED",
    actor: actorOf(user),
    metadata: { entrees: result.checked, integre: result.firstBrokenId === null },
  });
  return { ...result, verifiedAt: new Date().toISOString() };
}
