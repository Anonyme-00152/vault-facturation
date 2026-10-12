import "server-only";

import type { AuditAction } from "@/generated/prisma/client";
import { addMonths, parisToday, startOfMonth, toIsoDate } from "@/lib/dates";

import { db } from "./db";

const ACCESS_ACTIONS: AuditAction[] = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGIN_LOCKED",
  "MFA_SUCCESS",
  "MFA_FAILURE",
  "CHARTER_ACCEPTED",
  "CLIENT_VIEWED",
  "CLIENT_EXPORTED",
  "INVOICE_PDF_EXPORTED",
  "ACCESS_DENIED",
  "SESSION_EXPIRED",
];

export async function getDashboard(viewer: { id: string; role: string }) {
  const today = parisToday();
  const monthStart = startOfMonth(today);
  const previousMonthStart = addMonths(monthStart, -1);
  const yearAgo = addMonths(monthStart, -11);

  const [thisMonth, previousMonth, outstanding, overdue, activeClients, newClients, monthly, recentInvoices, recentAccess] =
    await Promise.all([
      db.invoice.aggregate({
        where: { number: { not: null }, issueDate: { gte: monthStart } },
        _sum: { totalHtCents: true },
        _count: true,
      }),
      db.invoice.aggregate({
        where: { number: { not: null }, issueDate: { gte: previousMonthStart, lt: monthStart } },
        _sum: { totalHtCents: true },
      }),
      db.invoice.aggregate({ where: { status: "SENT" }, _sum: { totalTtcCents: true }, _count: true }),
      db.invoice.aggregate({
        where: { status: "SENT", dueDate: { lt: today } },
        _sum: { totalTtcCents: true },
        _count: true,
      }),
      db.client.count({ where: { anonymizedAt: null } }),
      db.client.count({ where: { anonymizedAt: null, createdAt: { gte: monthStart } } }),
      db.$queryRaw<{ month: Date; total: bigint }[]>`
        SELECT date_trunc('month', issue_date)::date AS month, sum(total_ht_cents)::bigint AS total
          FROM invoices
         WHERE number IS NOT NULL AND issue_date >= ${yearAgo}
         GROUP BY 1 ORDER BY 1`,
      db.invoice.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          number: true,
          status: true,
          issueDate: true,
          dueDate: true,
          totalTtcCents: true,
          client: { select: { name: true } },
        },
      }),
      db.auditLog.findMany({
        // Les non-administrateurs ne voient que leurs propres accès.
        where: { action: { in: ACCESS_ACTIONS }, ...(viewer.role === "ADMIN" ? {} : { actorId: viewer.id }) },
        orderBy: { seq: "desc" },
        take: 6,
        select: { id: true, at: true, action: true, actorLabel: true, metadata: true, ip: true },
      }),
    ]);

  const byMonth = new Map(monthly.map((row) => [toIsoDate(row.month).slice(0, 7), Number(row.total)]));
  const revenue = Array.from({ length: 12 }, (_, index) => {
    const month = toIsoDate(addMonths(yearAgo, index)).slice(0, 7);
    return { month, amount: byMonth.get(month) ?? 0 };
  });

  const current = thisMonth._sum.totalHtCents ?? 0;
  const previous = previousMonth._sum.totalHtCents ?? 0;

  return {
    today,
    kpis: {
      revenueThisMonth: current,
      revenueDelta: previous > 0 ? (current - previous) / previous : null,
      invoicesThisMonth: thisMonth._count,
      outstanding: outstanding._sum.totalTtcCents ?? 0,
      outstandingCount: outstanding._count,
      overdue: overdue._sum.totalTtcCents ?? 0,
      overdueCount: overdue._count,
      activeClients,
      newClients,
    },
    revenue,
    recentInvoices,
    recentAccess,
  };
}
