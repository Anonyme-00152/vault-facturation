import { NextResponse } from "next/server";

import { env } from "@/env";
import { isCronAuthorized } from "@/server/cron";
import { seedDemo } from "@/server/demo/seed";

/**
 * Démonstration publique uniquement : les visiteurs peuvent tout modifier, les données
 * fictives sont donc rechargées chaque nuit. Le journal d'audit, en ajout seul, est conservé.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!env().DEMO_MODE) return NextResponse.json({ error: "Mode démonstration inactif" }, { status: 409 });
  await seedDemo({ reset: true });
  return NextResponse.json({ ok: true });
}

export const maxDuration = 60;
