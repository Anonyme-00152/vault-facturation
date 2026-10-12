import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutLink } from "@/components/auth/logout-link";
import { PasswordForm } from "@/components/auth/password-form";
import { requireStage } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ForcedPasswordPage() {
  const session = await requireStage("password");
  return (
    <AuthShell
      step={2}
      eyebrow="Étape 2 sur 3 · Mot de passe personnel"
      title={
        <>
          Choisissez
          <br />
          votre secret.
        </>
      }
      description="Votre compte a été créé avec un mot de passe provisoire. Remplacez-le par un mot de passe personnel : 12 caractères au minimum, une phrase de passe est idéale."
    >
      <PasswordForm mode="forced" email={session.user.email} name={session.user.name} />
      <div className="mt-8">
        <LogoutLink />
      </div>
    </AuthShell>
  );
}
