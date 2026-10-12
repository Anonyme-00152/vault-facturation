import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
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
      <LoginForm />
    </AuthShell>
  );
}
