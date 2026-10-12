import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { requireAccess } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewClientPage() {
  await requireAccess("clients:write");
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full">
        <Link href="/app/clients">
          <ArrowLeft data-icon="inline-start" />
          Clients
        </Link>
      </Button>
      <PageHeader eyebrow="Clients" title="Nouveau client" />
      <ClientForm
        initial={{
          type: "ENTREPRISE",
          name: "",
          siret: "",
          vatNumber: "",
          email: "",
          phone: "",
          line1: "",
          line2: "",
          postalCode: "",
          city: "",
          country: "France",
          paymentTermsDays: "30",
        }}
      />
    </div>
  );
}
