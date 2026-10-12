import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { DemoCode } from "@/components/auth/demo-code";
import { LogoutLink } from "@/components/auth/logout-link";
import { MfaForm } from "@/components/auth/mfa-form";
import { requireStage } from "@/server/auth/guard";
import { demoTotpHint } from "@/server/auth/demo-hint";

export const metadata: Metadata = { title: "Double authentification" };

export default async function MfaPage() {
  const session = await requireStage("mfa");
  const { user } = session;

  const demo = await demoTotpHint(user);

  return (
    <AuthShell
      step={2}
      title={
        <>
          Prouvez
          <br />
          que c&apos;est vous.
        </>
      }
      description={`Bonjour ${user.name.split(" ")[0]}. Ouvrez votre application d'authentification et saisissez le code « Vault Facturation ».`}
    >
      <MfaForm />
      {demo && <DemoCode code={demo.code} expiresInSeconds={demo.expiresInSeconds} />}
      <div className="mt-8">
        <LogoutLink>Ce n&apos;est pas vous ? Se déconnecter</LogoutLink>
      </div>
    </AuthShell>
  );
}
