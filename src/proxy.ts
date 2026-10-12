import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { buildCsp, createNonce } from "@/lib/security/csp";
import { STAGE_PATHS, stageFor, type Stage } from "@/server/auth/access";
import { loadSession } from "@/server/auth/session";

/** Pages du parcours d'accès, et l'étape à laquelle chacune correspond. */
const STAGE_PAGES: Record<string, Stage> = {
  "/connexion": "login",
  "/activation-2fa": "mfa-setup",
  "/connexion/2fa": "mfa",
  "/connexion/nouveau-mot-de-passe": "password",
  "/charte": "charter",
};

const isProtected = (path: string) =>
  path === "/app" ||
  path.startsWith("/app/") ||
  (path.startsWith("/api/") && !path.startsWith("/api/health") && !path.startsWith("/api/cron/"));

function withSecurityHeaders(request: NextRequest, decide: (headers: Headers) => NextResponse) {
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  // Next.js lit le nonce dans l'en-tête CSP de la requête et l'applique à ses propres scripts.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = decide(requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/**
 * Premier rempart, exécuté avant chaque page et chaque route d'API :
 * aucune donnée n'est servie tant que la session n'a pas franchi toutes les étapes
 * (mot de passe, double authentification, charte acceptée). Les pages, actions et
 * routes revérifient ensuite elles-mêmes (défense en profondeur).
 */
export const proxy = auth(async (request) => {
  const path = request.nextUrl.pathname;
  const stagePage = STAGE_PAGES[path];

  if (!stagePage && !isProtected(path)) {
    return withSecurityHeaders(request, (headers) => NextResponse.next({ request: { headers } }));
  }

  const session = await loadSession(request.auth?.sid, { touch: true });
  const stage = await stageFor(session);

  return withSecurityHeaders(request, (headers) => {
    if (isProtected(path) && stage !== "granted") {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
      }
      const target = new URL(STAGE_PATHS[stage], request.nextUrl);
      if (stage === "login" && request.auth?.sid) target.searchParams.set("raison", "session");
      return NextResponse.redirect(target);
    }
    if (stagePage && stagePage !== stage) {
      return NextResponse.redirect(new URL(STAGE_PATHS[stage], request.nextUrl));
    }
    return NextResponse.next({ request: { headers } });
  });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|fonts/|images/).*)"],
};
