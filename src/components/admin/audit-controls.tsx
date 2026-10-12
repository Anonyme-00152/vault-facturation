"use client";

import { Download, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { verifyAuditAction } from "@/app/(app)/app/admin/audit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "tous";

export function AuditFilters({
  users,
  actions,
}: {
  users: { id: string; name: string }[];
  actions: { group: string; items: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string | undefined) => {
    const search = new URLSearchParams(params);
    if (value && value !== ALL) search.set(key, value);
    else search.delete(key);
    search.delete("page");
    startTransition(() => router.replace(`${pathname}?${search.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center" aria-busy={pending}>
      <Select value={params.get("utilisateur") ?? ALL} onValueChange={(value) => set("utilisateur", value)}>
        <SelectTrigger aria-label="Filtrer par utilisateur" className="h-10 rounded-full bg-card lg:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les utilisateurs</SelectItem>
          <SelectItem value="systeme">Système et inconnus</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.get("action") ?? ALL} onValueChange={(value) => set("action", value)}>
        <SelectTrigger aria-label="Filtrer par action" className="h-10 rounded-full bg-card lg:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-96">
          <SelectItem value={ALL}>Toutes les actions</SelectItem>
          {actions.map((group) => (
            <SelectGroup key={group.group}>
              <SelectLabel>{group.group}</SelectLabel>
              {group.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Du
        <Input type="date" defaultValue={params.get("du") ?? ""} onChange={(event) => set("du", event.target.value)} className="h-10 w-40 rounded-full bg-card" />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        au
        <Input type="date" defaultValue={params.get("au") ?? ""} onChange={(event) => set("au", event.target.value)} className="h-10 w-40 rounded-full bg-card" />
      </label>
      {pending && <LoaderCircle className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

export function ExportCsvButton() {
  const params = useSearchParams();
  const search = new URLSearchParams(params);
  search.delete("page");
  return (
    <Button asChild variant="outline" size="pill" className="rounded-full">
      <a href={`/api/audit/export?${search.toString()}`} download>
        <Download data-icon="inline-start" />
        Exporter en CSV
      </a>
    </Button>
  );
}

export function VerifyIntegrity() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyAuditAction>>>();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="ink"
        size="pill"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await verifyAuditAction()))}
      >
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
        Vérifier l&apos;intégrité
      </Button>
      {result &&
        (result.firstBrokenId === null ? (
          <p role="status" className="flex items-center gap-2 rounded-full bg-status-paid px-3.5 py-2 text-sm text-status-paid-foreground">
            <ShieldCheck className="size-4" />
            Chaîne intègre : {result.checked} entrées vérifiées
          </p>
        ) : (
          <p role="alert" className="flex items-center gap-2 rounded-full bg-status-overdue px-3.5 py-2 text-sm text-status-overdue-foreground">
            <ShieldAlert className="size-4" />
            Altération détectée à l&apos;entrée n° {result.firstBrokenId}
          </p>
        ))}
    </div>
  );
}
