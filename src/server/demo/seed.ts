import "server-only";

import { addDays, parisToday } from "@/lib/dates";
import { frenchVatNumber } from "@/lib/validation";

import { audit } from "../audit";
import { CHARTER_V1, CHARTER_V2 } from "../charter/texts";
import { createClient } from "../clients/service";
import { encrypt } from "../crypto";
import { db } from "../db";
import { createDraft, issueInvoice, markPaid, type DraftLine } from "../invoices/service";
import { hashPassword } from "../auth/password";
import { DEMO_ACCOUNTS, demoPassword } from "./accounts";
import { createTotpSecret } from "../auth/totp";
import {
  CATALOG,
  CITIES,
  createRandom,
  fakeCompanyName,
  fakeIban,
  fakeLandline,
  fakeMobile,
  fakePersonName,
  fakeSiren,
  fakeSiret,
  fakeStreet,
  slugify,
  type Random,
} from "./fixtures";

const TABLES = [
  "invoice_lines",
  "invoices",
  "invoice_sequences",
  "clients",
  "charter_acceptances",
  "charter_versions",
  "backup_codes",
  "sessions",
  "users",
  "rate_limits",
  "settings",
];

/**
 * Remplit la base avec des données fictives : 3 utilisateurs (un par rôle),
 * 20 clients et 50 factures sur les 12 derniers mois.
 * Le journal d'audit n'est jamais vidé : il est en ajout seul, y compris ici.
 */
export async function seedDemo(options: { reset?: boolean; ifEmpty?: boolean } = {}) {
  if (options.ifEmpty && (await db.user.count()) > 0) {
    return { skipped: true as const };
  }
  if (options.reset) {
    await db.$executeRawUnsafe(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
  }

  const random = createRandom(2026);
  const today = parisToday();

  /* ── Organisation ─────────────────────────────────────── */
  const siren = fakeSiren(random);
  await db.settings.create({
    data: {
      companyName: "Atelier Lumen",
      legalForm: "SAS",
      shareCapitalCents: 1_000_000,
      siren,
      rcs: `RCS Lyon ${siren.replace(/(\d{3})(?=\d)/g, "$1 ")}`,
      vatNumber: frenchVatNumber(siren),
      addressLine1: "12 rue de la Charité",
      postalCode: "69002",
      city: "Lyon",
      email: "facturation@atelier-lumen.test",
      phone: "04 65 71 12 34",
      iban: fakeIban(random),
      bic: "FICTFRPPXXX",
    },
  });

  /* ── Utilisateurs ─────────────────────────────────────── */
  const passwordHash = await hashPassword(demoPassword());
  const users = [];
  for (const account of DEMO_ACCOUNTS) {
    const user = await db.user.create({
      data: { email: account.email, name: account.name, role: account.role, passwordHash, isDemo: true },
    });
    await db.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: encrypt(createTotpSecret(), `users.totp:${user.id}`), totpEnabledAt: new Date() },
    });
    users.push(user);
  }
  const [admin, accountant] = users as [(typeof users)[0], (typeof users)[0]];

  /* ── Charte : la v2 est publiée mais pas encore acceptée ─ */
  const v1 = await db.charterVersion.create({
    data: { ...CHARTER_V1, publishedAt: addDays(today, -220), publishedById: admin.id },
  });
  await db.charterVersion.create({
    data: { ...CHARTER_V2, publishedAt: addDays(today, -28), publishedById: admin.id },
  });
  for (const user of users) {
    await db.charterAcceptance.create({
      data: { userId: user.id, charterVersionId: v1.id, acceptedAt: addDays(today, -210), ip: "198.51.100.24" },
    });
  }

  /* ── Clients ──────────────────────────────────────────── */
  const usedNames = new Set<string>();
  const clients: { id: string; type: "ENTREPRISE" | "PARTICULIER"; terms: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const isCompany = i < 15;
    const place = random.pick(CITIES);
    const name = isCompany ? fakeCompanyName(random, usedNames) : fakePersonName(random, usedNames);
    const terms = isCompany ? random.pick([30, 30, 45]) : random.pick([0, 15]);
    const siret = isCompany ? fakeSiret(random) : undefined;
    const client = await createClient(
      {
        type: isCompany ? "ENTREPRISE" : "PARTICULIER",
        name,
        siret,
        vatNumber: siret ? frenchVatNumber(siret.slice(0, 9)) : undefined,
        email: isCompany ? `compta@${slugify(name)}.test` : `${slugify(name).replace("-", ".")}@exemple.test`,
        phone: isCompany ? fakeLandline(random) : fakeMobile(random),
        address: { line1: fakeStreet(random), postalCode: place.postalCode, city: place.city, country: "France" },
        paymentTermsDays: terms,
      },
      accountant.id,
    );
    clients.push({ id: client.id, type: client.type, terms });
  }

  // Deux clients inactifs depuis plus de 3 ans : candidats à la purge RGPD.
  const inactive = clients.slice(13, 15);
  for (const client of inactive) {
    await db.client.update({
      where: { id: client.id },
      data: { lastActivityAt: addDays(today, -1500), createdAt: addDays(today, -1800) },
    });
  }
  const active = clients.filter((client) => !inactive.includes(client));
  for (const client of active) {
    await db.client.update({ where: { id: client.id }, data: { createdAt: addDays(today, -400) } });
  }

  /* ── Factures : 46 émises dans l'ordre chronologique, 4 brouillons ── */
  const dayOfMonth = today.getUTCDate();
  const offsets = [
    ...Array.from({ length: 40 }, () => random.int(Math.max(dayOfMonth, 20), 360)),
    ...Array.from({ length: 6 }, () => random.int(1, Math.max(1, Math.min(dayOfMonth - 1, 20)))),
  ].sort((a, b) => b - a);

  const overdueSlots = new Set(offsets.map((offset, index) => ({ offset, index })).filter(({ offset }) => offset >= 50 && offset <= 120).slice(0, 3).map(({ index }) => index));

  for (const [index, offset] of offsets.entries()) {
    const client = random.pick(active);
    const draft = await createDraft(
      { clientId: client.id, paymentTermsDays: client.terms, lines: randomLines(random, client.type) },
      accountant.id,
    );
    const issueDate = addDays(today, -offset);
    await issueInvoice(draft.id, { issueDate });

    const dueDate = addDays(issueDate, client.terms);
    const pastDue = dueDate.getTime() < addDays(today, -3).getTime();
    const paid = overdueSlots.has(index) ? false : pastDue ? true : random.chance(0.3);
    if (paid) {
      const delay = random.int(2, Math.max(3, client.terms));
      const paidAt = addDays(issueDate, Math.min(delay, offset - 1));
      await markPaid(draft.id, paidAt);
    }
  }

  for (let i = 0; i < 4; i++) {
    const client = random.pick(active);
    await createDraft(
      { clientId: client.id, paymentTermsDays: client.terms, lines: randomLines(random, client.type) },
      accountant.id,
    );
  }

  await audit({ action: "DEMO_RESET", actor: null, metadata: { clients: 20, factures: 50 } });
  return { skipped: false as const };
}

function randomLines(random: Random, type: "ENTREPRISE" | "PARTICULIER"): DraftLine[] {
  const pool = type === "ENTREPRISE" ? CATALOG : CATALOG.filter((item) => item.unit <= 30_000);
  const count = type === "ENTREPRISE" ? random.int(1, 4) : random.int(1, 2);
  const picked = new Set<(typeof CATALOG)[number]>();
  while (picked.size < count) picked.add(random.pick(pool));
  return [...picked].map((item) => ({
    designation: item.designation,
    quantityMilli: random.int(item.qty[0], item.qty[1]) * 1000,
    unitPriceCents: item.unit,
    vatRateBp: item.vat,
  }));
}
