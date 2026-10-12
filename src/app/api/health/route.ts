import { NextResponse } from "next/server";

/** Sonde de disponibilité pour Docker. N'expose aucune information interne. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
