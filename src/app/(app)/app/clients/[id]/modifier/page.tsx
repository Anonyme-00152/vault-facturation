import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { requireAccess } from "@/server/auth/guard";
import { getClient } from "@/server/clients/queries";

export const metadata: Metadata = { title: "Modifier un client" };

export default async function EditClientPage({ params }: PageProps<"/app/clients/[id]/modifier">) {
  await requireAccess("clients:write");
  const { id } = await params;
  const client = /^[0-9a-f-]{36}$/.test(id) ? await getClient(id) : null;
  if (!client || client.anonymizedAt) notFound();

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href={`/app/clients/${client.id}`}>
          <ArrowLeft data-icon="inline-start" />
          {client.name}
        </Link>
      </Button>
      <PageHeader eyebrow="Modifier le client" title={client.name} />
      <ClientForm
        initial={{
          id: client.id,
          type: client.type,
          name: client.name,
          siret: client.siret ?? "",
          vatNumber: client.vatNumber ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          line1: client.address?.line1 ?? "",
          line2: client.address?.line2 ?? "",
          postalCode: client.address?.postalCode ?? "",
          city: client.address?.city ?? "",
          country: client.address?.country ?? "France",
          paymentTermsDays: String(client.paymentTermsDays),
        }}
      />
    </div>
  );
}
