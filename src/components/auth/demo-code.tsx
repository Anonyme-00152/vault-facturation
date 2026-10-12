"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Mode démonstration uniquement : affiche le code TOTP courant d'un compte de démo,
 * pour que le parcours complet soit testable sans téléphone. Jamais actif en production.
 */
export function DemoCode({ code, expiresInSeconds }: { code: string; expiresInSeconds: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(expiresInSeconds);

  useEffect(() => {
    const deadline = Date.now() + expiresInSeconds * 1000;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        window.clearInterval(interval);
        router.refresh();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [expiresInSeconds, router]);

  return (
    <aside className="mt-8 flex items-center gap-4 rounded-2xl border border-dashed border-border p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
        <FlaskConical className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-mono text-muted-foreground">Mode démonstration</p>
        <p className="text-sm text-muted-foreground">Code actuel du compte de démo, à recopier ci-dessus.</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-2xl tracking-[0.2em] tabular">
          {code.slice(0, 3)} {code.slice(3)}
        </p>
        <p className="label-mono text-[0.6rem] text-muted-foreground">Nouveau code dans {remaining} s</p>
      </div>
    </aside>
  );
}
