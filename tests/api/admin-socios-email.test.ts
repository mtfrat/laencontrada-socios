import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({ cookies: async () => ({
  set: (name: string, value: string) => cookieJar.set(name, value),
  get: (name: string) => cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  delete: (name: string) => cookieJar.delete(name),
}) }));
vi.mock("@/lib/prisma", async () => ({ prisma: (await import("../fakes/in-memory-prisma")).fakePrisma }));
vi.mock("@/lib/guards", () => ({ requireAdminSession: async () => ({ ok: true, session: { id: "admin-1", role: "SUPER_ADMIN" } }) }));

import { POST } from "@/app/api/admin/socios/route";
import { createSocioSession, getSocioSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

function update(email: string) {
  return POST(new Request("http://localhost/api/admin/socios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "actualizar_correo", socioId: "socio-1", email }) }));
}

beforeEach(() => {
  cookieJar.clear();
  fakePrisma.__reset({
    socios: [{ id: "socio-1", dni: "34123456", numeroSocio: "SOC-1001", nombre: "Juan", apellido: null, email: null, sessionVersion: 0, activo: true }],
    accessCodes: [{ id: "code-1", socioId: "socio-1", codigoHash: "hash", ipHash: "ip", intentos: 0, venceAt: new Date(Date.now() + 60_000), usadoAt: null }],
  });
});

describe("actualización administrativa del correo", () => {
  it("habilita el correo e invalida sesiones y códigos anteriores", async () => {
    await createSocioSession({ id: "socio-1", dni: "34123456", nombre: "Juan", numeroSocio: "SOC-1001" });
    expect(await getSocioSession()).not.toBeNull();
    const response = await update("  JUAN@EXAMPLE.COM  ");
    expect(response.status).toBe(200);
    const state = fakePrisma.__getState();
    expect(state.socios[0].email).toBe("juan@example.com");
    expect(state.socios[0].sessionVersion).toBe(1);
    expect(state.accessCodes[0].usadoAt).not.toBeNull();
    expect(await getSocioSession()).toBeNull();
  });

  it("rechaza un correo inválido sin cambiar la cuenta", async () => {
    const response = await update("no-es-correo");
    expect(response.status).toBe(400);
    const state = fakePrisma.__getState();
    expect(state.socios[0].email).toBeNull();
    expect(state.socios[0].sessionVersion).toBe(0);
  });
});
