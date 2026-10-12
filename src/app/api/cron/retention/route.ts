import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/server/cron";
import { purgeInactiveClients } from "@/server/retention";

/** Tâche quotidienne : applique la durée de conservation des clients inactifs. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const result = await purgeInactiveClients({ id: null, label: "Tâche planifiée" });
  return NextResponse.json({ ok: true, ...result });
}
