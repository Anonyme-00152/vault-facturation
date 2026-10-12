"use client";

import { KeyRound, LoaderCircle, MonitorX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { regenerateBackupCodesAction, revokeOtherSessionsAction } from "@/app/(app)/app/compte/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RegenerateBackupCodes() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog onOpenChange={(open) => !open && setCodes(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="pill" className="rounded-full">
          <KeyRound data-icon="inline-start" />
          Régénérer les codes de secours
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveaux codes de secours</DialogTitle>
          <DialogDescription>
            {codes
              ? "Notez-les maintenant : ils ne seront plus affichés. Les anciens codes ne fonctionnent plus."
              : "Les codes actuels seront invalidés et remplacés par 10 nouveaux codes."}
          </DialogDescription>
        </DialogHeader>
        {codes ? (
          <ol className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-4 font-mono text-sm tracking-wider">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ol>
        ) : (
          <DialogFooter>
            <Button
              variant="ink"
              size="pill"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await regenerateBackupCodesAction();
                  if (result.codes) setCodes(result.codes);
                })
              }
            >
              {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
              Générer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RevokeOtherSessions({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="pill"
      className="rounded-full"
      disabled={pending || count === 0}
      onClick={() =>
        startTransition(async () => {
          const result = await revokeOtherSessionsAction();
          toast.success(result.count > 1 ? `${result.count} sessions fermées` : "Session fermée");
        })
      }
    >
      <MonitorX data-icon="inline-start" />
      Fermer les autres sessions
    </Button>
  );
}
