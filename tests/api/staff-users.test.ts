import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const guard = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guards", () => ({ requireSuperAdminSession: () => guard() }));
vi.mock("@/lib/prisma", () => ({ prisma: { usuario: {
  findUnique: (...args: unknown[]) => findUnique(...args),
  create: (...args: unknown[]) => create(...args),
} } }));

import { POST } from "@/app/api/admin/usuarios/route";

function request(body: unknown) {
  return new Request("http://localhost/api/admin/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  guard.mockReset().mockResolvedValue({ ok: true, session: { id: "super-1", role: "SUPER_ADMIN" } });
  findUnique.mockReset().mockResolvedValue(null);
  create.mockReset().mockImplementation(({ data }) => ({ id: "staff-2", ...data }));
});

describe("alta de cuentas de personal", () => {
  it("crea una cuenta con email normalizado, usuario generado y clave cifrada", async () => {
    const response = await POST(request({ email: " MOZ@EJEMPLO.COM ", nombre: "Equipo Salón", role: "EQUIPO", password: "clave-larga-123" }));
    expect(response.status).toBe(200);
    const data = create.mock.calls[0][0].data;
    expect(data.email).toBe("moz@ejemplo.com");
    expect(data.username).toMatch(/^moz_[a-f0-9]{6}$/);
    expect(data.passwordHash).not.toBe("clave-larga-123");
    expect(await bcrypt.compare("clave-larga-123", data.passwordHash)).toBe(true);
  });

  it("rechaza cuentas sin email o con contraseña corta", async () => {
    expect((await POST(request({ nombre: "Equipo Salón", role: "EQUIPO", password: "clave-larga-123" }))).status).toBe(400);
    expect((await POST(request({ email: "moz@ejemplo.com", nombre: "Equipo Salón", role: "EQUIPO", password: "corta" }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
