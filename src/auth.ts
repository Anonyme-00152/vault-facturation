import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticate, SESSION_MAX_AGE_SECONDS } from "@/server/auth/login";

/** Erreur de connexion transmise au formulaire. Le code ne révèle jamais si l'email existe. */
export class LoginError extends CredentialsSignin {
  constructor(
    public override code: "invalid" | "locked" | "throttled",
    public retryAfterSeconds = 0,
  ) {
    super();
  }
}

const secureCookies = (process.env.APP_URL ?? "").startsWith("https://");

/**
 * Auth.js gère le cookie de session chiffré (JWE). Ce cookie ne contient qu'un
 * identifiant de session opaque : l'état réel (2FA, expiration, révocation,
 * inactivité) vit en base et est vérifié à chaque requête.
 */
export const { auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/connexion", error: "/connexion" },
  cookies: {
    sessionToken: {
      // Préfixe __Host- : cookie limité à l'hôte exact, en HTTPS, sans domaine.
      name: secureCookies ? "__Host-vault.session" : "vault.session",
      options: { httpOnly: true, sameSite: "strict", path: "/", secure: secureCookies },
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const result = await authenticate({ email: credentials?.email, password: credentials?.password });
        if (!result.ok) throw new LoginError(result.code, result.retryAfterSeconds);
        return { id: result.sessionToken };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sid = user.id;
      // Aucune donnée d'identité dans le jeton.
      delete token.name;
      delete token.email;
      delete token.picture;
      delete token.sub;
      return token;
    },
    session({ session, token }) {
      return { expires: session.expires, sid: token.sid } as typeof session;
    },
  },
});
