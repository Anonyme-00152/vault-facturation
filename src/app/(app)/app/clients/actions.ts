"use server";

import { redirect } from "next/navigation";

import { clientSchema, fieldErrors } from "@/lib/validation";
import { audit } from "@/server/audit";
import { actorOf, requireAccess } from "@/server/auth/guard";
import { anonymizeClient, createClient, findClientByEmail, updateClient } from "@/server/clients/service";
import { getClient } from "@/server/clients/queries";
import { db } from "@/server/db";

export type ClientFormState = { error?: string; errors?: Record<string, string>; values?: Record<string, string> };

function readForm(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    type: get("type"),
    name: get("name"),
    siret: get("siret"),
    vatNumber: get("vatNumber"),
    email: get("email"),
    phone: get("phone"),
    address: {
      line1: get("line1"),
      line2: get("line2"),
      postalCode: get("postalCode"),
      city: get("city"),
      country: get("country") || "France",
    },
    paymentTermsDays: get("paymentTermsDays"),
  };
}

const flatValues = (raw: ReturnType<typeof readForm>): Record<string, string> => {
  const { address, ...rest } = raw;
  return { ...rest, ...address };
};

export async function saveClientAction(_: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await requireAccess("clients:write");
  const id = String(formData.get("id") ?? "") || null;
  const raw = readForm(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // « address.city » → « city » : les champs d'adresse sont à plat dans le formulaire.
    const flat = Object.fromEntries(Object.entries(errors).map(([key, message]) => [key.replace("address.", ""), message]));
    return { error: "Certains champs sont à corriger.", errors: flat, values: flatValues(raw) };
  }

  const input = parsed.data;
  if (input.type === "PARTICULIER") {
    input.siret = undefined;
    input.vatNumber = undefined;
  }

  if (input.email) {
    const duplicate = await findClientByEmail(input.email);
    if (duplicate && duplicate.id !== id) {
      return {
        error: `Un client utilise déjà cette adresse e-mail : ${duplicate.name}.`,
        errors: { email: "Adresse déjà utilisée" },
        values: flatValues(raw),
      };
    }
  }

  let clientId: string;
  if (id) {
    const before = await getClient(id);
    if (!before || before.anonymizedAt) return { error: "Ce client n'existe plus ou a été anonymisé." };
    await updateClient(id, input);
    // Seuls les noms des champs modifiés sont journalisés, jamais leurs valeurs.
    const changed = (
      [
        ["raison sociale", before.name !== input.name],
        ["type", before.type !== input.type],
        ["siret", (before.siret ?? undefined) !== input.siret],
        ["tva", (before.vatNumber ?? undefined) !== input.vatNumber],
        ["e-mail", (before.email ?? undefined) !== input.email],
        ["téléphone", (before.phone ?? undefined) !== input.phone],
        ["adresse", JSON.stringify(before.address) !== JSON.stringify(input.address)],
        ["délai de paiement", before.paymentTermsDays !== input.paymentTermsDays],
      ] as const
    )
      .filter(([, didChange]) => didChange)
      .map(([label]) => label)
      .join(", ");
    await audit({
      action: "CLIENT_UPDATED",
      actor: actorOf(user),
      entityType: "client",
      entityId: id,
      metadata: { champs: changed || "aucun" },
    });
    clientId = id;
  } else {
    const client = await createClient(input, user.id);
    await audit({ action: "CLIENT_CREATED", actor: actorOf(user), entityType: "client", entityId: client.id });
    clientId = client.id;
  }
  redirect(`/app/clients/${clientId}?enregistre=1`);
}

export async function deleteClientAction(id: string) {
  const user = await requireAccess("clients:write");
  const invoices = await db.invoice.count({ where: { clientId: id } });
  if (invoices > 0) return { error: "Ce client a des factures : il ne peut pas être supprimé, seulement anonymisé." };
  await db.client.delete({ where: { id } });
  await audit({ action: "CLIENT_DELETED", actor: actorOf(user), entityType: "client", entityId: id });
  redirect("/app/clients?supprime=1");
}

/** Droit à l'effacement (RGPD) : réservé à l'administrateur. */
export async function anonymizeClientAction(id: string) {
  const user = await requireAccess("gdpr:manage");
  const client = await getClient(id);
  if (!client || client.anonymizedAt) return { error: "Ce client est déjà anonymisé." };
  await anonymizeClient(id);
  const invoices = await db.invoice.count({ where: { clientId: id, number: { not: null } } });
  await audit({
    action: "CLIENT_ANONYMIZED",
    actor: actorOf(user),
    entityType: "client",
    entityId: id,
    metadata: { motif: "droit à l'effacement", factures_conservees: invoices },
  });
  redirect(`/app/clients/${id}?anonymise=1`);
}
