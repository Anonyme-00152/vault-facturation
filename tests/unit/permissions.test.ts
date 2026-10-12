import { describe, expect, it } from "vitest";

import { can, PERMISSIONS, type Permission } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";

describe("matrice des permissions (RBAC)", () => {
  it("n'accorde l'administration qu'à l'administrateur", () => {
    for (const permission of ["users:manage", "charter:manage", "audit:read", "gdpr:manage"] as Permission[]) {
      expect(can("ADMIN", permission)).toBe(true);
      expect(can("COMPTABLE", permission)).toBe(false);
      expect(can("LECTEUR", permission)).toBe(false);
    }
  });

  it("réserve la création et la modification au comptable", () => {
    expect(can("COMPTABLE", "clients:write")).toBe(true);
    expect(can("COMPTABLE", "invoices:write")).toBe(true);
    expect(can("ADMIN", "clients:write")).toBe(false);
    expect(can("ADMIN", "invoices:write")).toBe(false);
    expect(can("LECTEUR", "clients:write")).toBe(false);
    expect(can("LECTEUR", "invoices:write")).toBe(false);
  });

  it("interdit l'export au lecteur", () => {
    expect(can("LECTEUR", "invoices:export")).toBe(false);
    expect(can("COMPTABLE", "invoices:export")).toBe(true);
    expect(can("ADMIN", "invoices:export")).toBe(true);
  });

  it("donne la consultation à tous les rôles", () => {
    for (const role of ROLES) {
      expect(can(role, "clients:read")).toBe(true);
      expect(can(role, "invoices:read")).toBe(true);
      expect(can(role, "dashboard:read")).toBe(true);
    }
  });

  it("ne référence que des rôles existants", () => {
    for (const roles of Object.values(PERMISSIONS)) {
      for (const role of roles) expect(ROLES).toContain(role);
    }
  });
});
