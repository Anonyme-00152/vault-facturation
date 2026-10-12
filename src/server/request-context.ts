import "server-only";

import { headers } from "next/headers";

export type RequestContext = { ip: string | null; userAgent: string | null };

/**
 * Adresse IP et navigateur de la requête en cours, ou null hors requête (scripts, cron).
 * Derrière un proxy de confiance (Vercel, Docker), l'IP réelle est la première de
 * `x-forwarded-for`.
 */
export async function requestContext(): Promise<RequestContext> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Libellé lisible d'un navigateur : « Chrome · Windows ». */
export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Inconnu";
  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : /curl|node|undici/i.test(userAgent) ? "Script"
    : "Navigateur";
  const os =
    /Windows/.test(userAgent) ? "Windows"
    : /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Mac OS X/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux"
    : "";
  return os ? `${browser} · ${os}` : browser;
}

/** IP partiellement masquée pour l'affichage : 192.168.1.42 → 192.168.x.x */
export function maskIp(ip: string | null | undefined): string {
  if (!ip) return "—";
  if (ip.includes(".")) return ip.split(".").slice(0, 2).join(".") + ".x.x";
  return ip.split(":").slice(0, 3).join(":") + ":…";
}
