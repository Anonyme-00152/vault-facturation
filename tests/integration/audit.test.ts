import { afterAll, describe, expect, it } from "vitest";

import { audit, verifyAuditChain } from "@/server/audit";
import { db } from "@/server/db";

afterAll(() => db.$disconnect());

describe("journal d'audit", () => {
  it("enregistre une action et chaîne les empreintes", async () => {
    await audit({ action: "LOGIN_SUCCESS", actor: { id: "0199c5a0-0000-7000-8000-000000000001", label: "test" } });
    await audit({ action: "LOGOUT", actor: null });
    const last = await db.auditLog.findMany({ orderBy: { seq: "desc" }, take: 2 });
    expect(last[0]!.prevHash).toBe(last[1]!.hash);
    expect(last[0]!.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyAuditChain()).toMatchObject({ firstBrokenId: null });
  });

  it("filtre les données personnelles des métadonnées", async () => {
    await audit({
      action: "CLIENT_UPDATED",
      actor: null,
      metadata: { champ: "adresse", email: "fuite@exemple.test", phone: "0600000000", count: 2 },
    });
    const entry = await db.auditLog.findFirst({ orderBy: { seq: "desc" } });
    expect(entry!.metadata).toEqual({ champ: "adresse", count: 2 });
  });

  it("refuse toute modification ou suppression", async () => {
    const entry = await db.auditLog.findFirstOrThrow();
    await expect(db.auditLog.update({ where: { id: entry.id }, data: { action: "LOGOUT" } })).rejects.toThrow();
    await expect(db.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow();
    await expect(db.$executeRawUnsafe("TRUNCATE audit_log")).rejects.toThrow();
  });

  it("détecte une altération faite en contournant les triggers", async () => {
    const entry = await db.auditLog.findFirstOrThrow({ orderBy: { seq: "desc" } });
    // Simule un administrateur de base malveillant qui désactive la protection.
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("ALTER TABLE audit_log DISABLE TRIGGER audit_log_append_only_rows");
      await tx.$executeRaw`UPDATE audit_log SET actor_label = 'falsifié' WHERE id = ${entry.id}`;
      await tx.$executeRawUnsafe("ALTER TABLE audit_log ENABLE TRIGGER audit_log_append_only_rows");
    });
    const result = await verifyAuditChain();
    expect(result.firstBrokenId).toBe(String(entry.id));

    // Remet la base de test dans un état cohérent.
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("ALTER TABLE audit_log DISABLE TRIGGER audit_log_append_only_rows");
      await tx.$executeRaw`UPDATE audit_log SET actor_label = ${entry.actorLabel} WHERE id = ${entry.id}`;
      await tx.$executeRawUnsafe("ALTER TABLE audit_log ENABLE TRIGGER audit_log_append_only_rows");
    });
    expect((await verifyAuditChain()).firstBrokenId).toBeNull();
  });
});
