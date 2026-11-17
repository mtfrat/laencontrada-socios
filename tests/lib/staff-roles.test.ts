import { beforeEach, describe, expect, it, vi } from "vitest";

const staffSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({
  getStaffSession: () => staffSession(),
  getSocioSession: vi.fn(),
}));

import { requireAdminSession, requireSuperAdminSession } from "@/lib/guards";

beforeEach(() => staffSession.mockReset());

describe("permisos de personal", () => {
  it("solo administración puede gestionar cuentas", async () => {
    staffSession.mockResolvedValue({ id: "1", role: "ADMIN" });
    const admin = await requireAdminSession();
    const superAdmin = await requireSuperAdminSession();
    expect(admin.ok).toBe(false);
    expect(superAdmin.ok).toBe(false);
    if (!superAdmin.ok) expect(superAdmin.response.status).toBe(403);
  });

  it("superadministración accede a gestión y cuentas", async () => {
    staffSession.mockResolvedValue({ id: "1", role: "SUPER_ADMIN" });
    expect((await requireAdminSession()).ok).toBe(true);
    expect((await requireSuperAdminSession()).ok).toBe(true);
  });

  it("personal operativo no accede a administración", async () => {
    staffSession.mockResolvedValue({ id: "1", role: "BARRA" });
    const result = await requireAdminSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});
