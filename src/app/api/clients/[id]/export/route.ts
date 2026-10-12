import { NextResponse, type NextRequest } from "next/server";

import { audit } from "@/server/audit";
import { actorOf, requireApiAccess } from "@/server/auth/guard";
import { getClient, getClientInvoices } from "@/server/clients/queries";
import { hit, RULES } from "@/server/rate-limit";

/** Droit d'accès (article 15 du RGPD) : export du dossier complet d'un client. */
export async function GET(_: NextRequest, { params }: RouteContext<"/api/clients/[id]/export">) {
  const { user, response } = await requireApiAccess("gdpr:manage");
  if (response) return response;
  if ((await hit(`api:${user.id}`, RULES.apiPerUser)).blocked) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id } = await params;
  const client = /^[0-9a-f-]{36}$/.test(id) ? await getClient(id) : null;
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const invoices = await getClientInvoices(client.id);
  await audit({ action: "CLIENT_EXPORTED", actor: actorOf(user), entityType: "client", entityId: client.id });

  const body = {
    export: {
      genere_le: new Date().toISOString(),
      fondement: "Article 15 du RGPD : droit d'accès de la personne concernée",
      responsable_du_traitement: "Atelier Lumen (données fictives de démonstration)",
    },
    client: {
      type: client.type,
      nom: client.name,
      siret: client.siret,
      tva_intracommunautaire: client.vatNumber,
      email: client.email,
      telephone: client.phone,
      adresse: client.address,
      delai_paiement_jours: client.paymentTermsDays,
      cree_le: client.createdAt.toISOString(),
      derniere_activite: client.lastActivityAt.toISOString(),
      anonymise_le: client.anonymizedAt?.toISOString() ?? null,
    },
    factures: invoices.map((invoice) => ({
      numero: invoice.number,
      statut: invoice.status,
      emise_le: invoice.issueDate?.toISOString().slice(0, 10) ?? null,
      echeance: invoice.dueDate.toISOString().slice(0, 10),
      total_ttc_euros: invoice.totalTtcCents / 100,
    })),
    conservation: {
      fiche: "Anonymisée après la durée d'inactivité définie par l'administrateur",
      factures: "10 ans à compter de la clôture de l'exercice (article L123-22 du Code de commerce)",
    },
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="export-client-${client.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
