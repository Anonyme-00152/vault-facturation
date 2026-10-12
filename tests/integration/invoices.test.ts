import { afterAll, describe, expect, it } from "vitest";

import { anonymizeClient, createClient } from "@/server/clients/service";
import { db } from "@/server/db";
import { createDraft, deleteDraft, issueInvoice, markPaid, updateDraft } from "@/server/invoices/service";

const line = { designation: "Développement (jour)", quantityMilli: 1000, unitPriceCents: 60_000, vatRateBp: 2000 };

async function newClient(name: string) {
  return createClient(
    {
      type: "ENTREPRISE",
      name,
      siret: "00042731000016",
      address: { line1: "1 rue des Tests", postalCode: "69002", city: "Lyon", country: "France" },
      paymentTermsDays: 30,
    },
    null,
  );
}

async function maxSequence(year: number) {
  const row = await db.invoiceSequence.findUnique({ where: { year } });
  return row?.lastNumber ?? 0;
}

afterAll(() => db.$disconnect());

describe("numérotation des factures", () => {
  it("reste continue et sans doublon avec 20 émissions simultanées", async () => {
    const client = await newClient("Client Concurrence SAS");
    const drafts = await Promise.all(
      Array.from({ length: 20 }, () => createDraft({ clientId: client.id, paymentTermsDays: 30, lines: [line] }, null)),
    );
    const year = new Date().getUTCFullYear();
    const before = await maxSequence(year);

    const issued = await Promise.all(drafts.map((draft) => issueInvoice(draft.id)));

    const sequences = issued.map((invoice) => invoice.sequence!).sort((a, b) => a - b);
    expect(sequences).toEqual(Array.from({ length: 20 }, (_, i) => before + i + 1));
    expect(new Set(issued.map((invoice) => invoice.number)).size).toBe(20);
    expect(await maxSequence(year)).toBe(before + 20);
  });

  it("ne consomme aucun numéro quand l'émission échoue", async () => {
    const client = await newClient("Client Anonymisé SAS");
    const draft = await createDraft({ clientId: client.id, paymentTermsDays: 30, lines: [line] }, null);
    await anonymizeClient(client.id);
    const year = new Date().getUTCFullYear();
    const before = await maxSequence(year);

    await expect(issueInvoice(draft.id)).rejects.toThrow(/anonymisé/);
    expect(await maxSequence(year)).toBe(before);
  });

  it("garde l'ordre chronologique : chaque année repart à 1 sans trou", async () => {
    const rows = await db.invoice.findMany({
      where: { number: { not: null } },
      select: { year: true, sequence: true },
      orderBy: [{ year: "asc" }, { sequence: "asc" }],
    });
    const byYear = new Map<number, number[]>();
    for (const row of rows) byYear.set(row.year!, [...(byYear.get(row.year!) ?? []), row.sequence!]);
    for (const sequences of byYear.values()) {
      expect(sequences).toEqual(Array.from({ length: sequences.length }, (_, i) => i + 1));
    }
  });
});

describe("cycle de vie d'une facture", () => {
  it("calcule les totaux, émet, puis interdit toute modification", async () => {
    const client = await newClient("Client Cycle SAS");
    const draft = await createDraft(
      {
        clientId: client.id,
        paymentTermsDays: 30,
        lines: [line, { designation: "Hébergement (mois)", quantityMilli: 2000, unitPriceCents: 9_500, vatRateBp: 2000 }],
      },
      null,
    );
    expect(draft.number).toBeNull();
    expect(draft.totalHtCents).toBe(79_000);
    expect(draft.totalVatCents).toBe(15_800);
    expect(draft.totalTtcCents).toBe(94_800);

    const issued = await issueInvoice(draft.id);
    expect(issued.number).toMatch(/^FAC-\d{4}-\d{6}$/);
    expect(issued.status).toBe("SENT");
    expect(issued.clientSnapshotEnc).toMatch(/^v1:/);

    await expect(updateDraft(draft.id, { clientId: client.id, paymentTermsDays: 30, lines: [line] })).rejects.toThrow(
      /ne peut plus être modifiée/,
    );
    await expect(deleteDraft(draft.id)).rejects.toThrow(/10 ans/);

    // Même en contournant l'application, la base refuse.
    await expect(db.invoice.update({ where: { id: draft.id }, data: { totalHtCents: 1, totalTtcCents: 15_801 } })).rejects.toThrow();
    await expect(db.invoice.delete({ where: { id: draft.id } })).rejects.toThrow();
    await expect(db.invoiceLine.updateMany({ where: { invoiceId: draft.id }, data: { unitPriceCents: 1 } })).rejects.toThrow();

    const paid = await markPaid(draft.id);
    expect(paid.status).toBe("PAID");
  });

  it("autorise la modification et la suppression d'un brouillon", async () => {
    const client = await newClient("Client Brouillon SAS");
    const draft = await createDraft({ clientId: client.id, paymentTermsDays: 30, lines: [line] }, null);
    const updated = await updateDraft(draft.id, { clientId: client.id, paymentTermsDays: 15, lines: [line, line] });
    expect(updated.totalHtCents).toBe(120_000);
    await deleteDraft(draft.id);
    expect(await db.invoice.findUnique({ where: { id: draft.id } })).toBeNull();
  });
});
