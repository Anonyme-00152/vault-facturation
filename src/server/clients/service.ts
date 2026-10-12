import "server-only";

import type { Client, ClientType } from "@/generated/prisma/client";
import { uuidv7 } from "@/lib/ids";
import type { Address, ClientInput } from "@/lib/validation";

import { blindIndex, decryptJson, decryptNullable, encrypt, encryptJson } from "../crypto";
import { db, type Tx } from "../db";

/**
 * Accès aux fiches clients. Le chiffrement et le déchiffrement des champs sensibles
 * sont faits ici, et nulle part ailleurs. Les contrôles d'accès et la journalisation
 * sont faits par les actions serveur qui appellent ces fonctions.
 */

const ctx = (id: string, field: "email" | "phone" | "address") => `clients.${field}:${id}`;

export type ClientRecord = {
  id: string;
  type: ClientType;
  name: string;
  siret: string | null;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  address: Address | null;
  paymentTermsDays: number;
  lastActivityAt: Date;
  anonymizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function decryptClient(client: Client): ClientRecord {
  return {
    id: client.id,
    type: client.type,
    name: client.name,
    siret: client.siret,
    vatNumber: client.vatNumber,
    email: decryptNullable(client.emailEnc, ctx(client.id, "email")),
    phone: decryptNullable(client.phoneEnc, ctx(client.id, "phone")),
    address: client.addressEnc ? decryptJson<Address>(client.addressEnc, ctx(client.id, "address")) : null,
    paymentTermsDays: client.paymentTermsDays,
    lastActivityAt: client.lastActivityAt,
    anonymizedAt: client.anonymizedAt,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

function encryptedFields(id: string, input: ClientInput) {
  return {
    type: input.type,
    name: input.name,
    siret: input.siret ?? null,
    vatNumber: input.vatNumber ?? null,
    emailEnc: input.email ? encrypt(input.email, ctx(id, "email")) : null,
    emailHash: input.email ? blindIndex(input.email) : null,
    phoneEnc: input.phone ? encrypt(input.phone, ctx(id, "phone")) : null,
    addressEnc: encryptJson(input.address, ctx(id, "address")),
    paymentTermsDays: input.paymentTermsDays,
  };
}

export async function createClient(input: ClientInput, createdById: string | null, tx?: Tx) {
  const id = uuidv7();
  return (tx ?? db).client.create({
    data: { id, ...encryptedFields(id, input), createdById, lastActivityAt: new Date() },
  });
}

export async function updateClient(id: string, input: ClientInput, tx?: Tx) {
  return (tx ?? db).client.update({
    where: { id, anonymizedAt: null },
    data: { ...encryptedFields(id, input), lastActivityAt: new Date() },
  });
}

export async function findClientByEmail(email: string) {
  return db.client.findFirst({ where: { emailHash: blindIndex(email), anonymizedAt: null } });
}

/** Identité du client figée sur une facture émise. */
export type ClientSnapshot = {
  type: ClientType;
  name: string;
  siret: string | null;
  vatNumber: string | null;
  address: Address | null;
};

export function toClientSnapshot(client: ClientRecord): ClientSnapshot {
  return {
    type: client.type,
    name: client.name,
    siret: client.siret,
    vatNumber: client.vatNumber,
    address: client.address,
  };
}

/**
 * Droit à l'effacement : la fiche est vidée de toute donnée personnelle.
 * Les factures émises gardent leur copie figée (obligation de conservation de 10 ans).
 */
export async function anonymizeClient(id: string, tx?: Tx) {
  return (tx ?? db).client.update({
    where: { id },
    data: {
      name: `Client anonymisé ${id.slice(-6).toUpperCase()}`,
      siret: null,
      vatNumber: null,
      emailEnc: null,
      emailHash: null,
      phoneEnc: null,
      addressEnc: null,
      anonymizedAt: new Date(),
    },
  });
}
