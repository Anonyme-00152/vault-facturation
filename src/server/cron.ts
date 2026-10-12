import "server-only";

import { env } from "@/env";

import { safeEqual } from "./crypto";

/** Les tâches planifiées s'authentifient par un secret partagé (en-tête Authorization: Bearer). */
export function isCronAuthorized(request: Request): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${secret}`);
}
