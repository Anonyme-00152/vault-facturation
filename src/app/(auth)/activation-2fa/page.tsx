import type { Metadata } from "next";
import QRCode from "qrcode";

import { AuthShell } from "@/components/auth/auth-shell";
import { EnrollForm } from "@/components/auth/enroll-form";
import { LogoutLink } from "@/components/auth/logout-link";
import { requireStage } from "@/server/auth/guard";
import { createTotpSecret, totpUri } from "@/server/auth/totp";
import { decrypt, encrypt } from "@/server/crypto";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Activer la double authentification" };

export default async function EnrollPage() {
  const session = await requireStage("mfa-setup");
  const { user } = session;

  // Secret en attente : stocké chiffré, actif seulement après la confirmation d'un premier code.
  let secret: string;
  if (user.totpSecretEnc) {
    secret = decrypt(user.totpSecretEnc, `users.totp:${user.id}`);
  } else {
    secret = createTotpSecret();
    await db.user.update({ where: { id: user.id }, data: { totpSecretEnc: encrypt(secret, `users.totp:${user.id}`) } });
  }

  const qr = await QRCode.toString(totpUri(secret, user.email), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0e0f13", light: "#ffffff" },
  });

  return (
    <AuthShell
      step={2}
      eyebrow="Étape 2 sur 3 · Activation de la double authentification"
      title={
        <>
          Un code,
          <br />
          une clé de plus.
        </>
      }
      description="L'accès aux données clients exige une double authentification. Scannez ce QR code avec Google Authenticator, Microsoft Authenticator ou 1Password."
    >
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="size-44 shrink-0 rounded-2xl bg-white p-3 ring-1 ring-border [&_svg]:size-full"
          role="img"
          aria-label="QR code de configuration de l'application d'authentification"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Impossible de scanner ? Saisissez cette clé manuellement :</p>
          <p className="rounded-xl bg-muted px-3 py-2 font-mono text-[0.8rem] tracking-wider break-all text-foreground select-all">
            {secret.match(/.{1,4}/g)?.join(" ")}
          </p>
        </div>
      </div>
      <EnrollForm />
      <div className="mt-8">
        <LogoutLink />
      </div>
    </AuthShell>
  );
}
