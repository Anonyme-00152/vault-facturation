import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-alert";
import { LoginForm } from "@/components/auth/login-form";
import { env } from "@/env";
import { DEMO_ACCOUNTS, demoPassword } from "@/server/demo/accounts";

export const metadata: Metadata = { title: "Connexion" };

const REASONS: Record<string, { text: string; tone: "info" | "error" }> = {
  deconnexion: { text: "Vous êtes déconnecté. À bientôt.", tone: "info" },
  inactivite: { text: "Session fermée après 15 minutes d'inactivité.", tone: "info" },
  session: { text: "Votre session a expiré. Reconnectez-vous.", tone: "info" },
  "2fa": { text: "Trop de codes erronés : reconnectez-vous pour réessayer.", tone: "error" },
};

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { raison } = await searchParams;
  const reason = typeof raison === "string" ? REASONS[raison] : undefined;
  const demo = env().DEMO_MODE
    ? { accounts: DEMO_ACCOUNTS.map((account) => ({ ...account })), password: demoPassword() }
    : undefined;

  return (
    <AuthShell
      step={1}
      title={
        <>
          Ouvrir
          <br />
          le coffre.
        </>
      }
      description="Connectez-vous avec votre compte personnel. Après cinq tentatives infructueuses, l'accès est suspendu pendant quinze minutes."
    >
      {reason && (
        <FormAlert tone={reason.tone} className="mb-6">
          {reason.text}
        </FormAlert>
      )}
      <LoginForm demo={demo} />
    </AuthShell>
  );
}
