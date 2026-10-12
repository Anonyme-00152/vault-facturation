import { NextResponse, type NextRequest } from "next/server";

import { audit } from "@/server/audit";
import { auditCsv, parseAuditFilters } from "@/server/audit-queries";
import { actorOf, requireApiAccess } from "@/server/auth/guard";
import { hit, RULES } from "@/server/rate-limit";

export async function GET(request: NextRequest) {
  const { user, response } = await requireApiAccess("audit:read");
  if (response) return response;
  if ((await hit(`api:${user.id}`, RULES.apiPerUser)).blocked) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const filters = parseAuditFilters(Object.fromEntries(request.nextUrl.searchParams));
  const { csv, rows } = await auditCsv(filters);
  await audit({
    action: "AUDIT_EXPORTED",
    actor: actorOf(user),
    metadata: { lignes: rows, action_filtree: filters.action ?? null, du: filters.from ?? null, au: filters.to ?? null },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal-audit-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
