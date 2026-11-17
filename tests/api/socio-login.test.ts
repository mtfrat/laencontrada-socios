import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
const rateCounts = vi.hoisted(() => new Map<string, number>());
vi.mock("@/lib/persistent-rate-limit", () => ({
  hitPersistentRateLimit: async (scope: string, identifier: string, limit: number) => {
    const key = `${scope}:${identifier}`;
    const count = (rateCounts.get(key) ?? 0) + 1;
    rateCounts.set(key, count);
    return { allowed: count <= limit, retryAfterSeconds: count <= limit ? 0 : 60 };
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  set: (name: string, value: string) => cookieJar.set(name, value),
  get: (name: string) => cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  delete: (name: string) => cookieJar.delete(name),
}) }));
vi.mock("@/lib/prisma", async () => ({ prisma: (await import("../fakes/in-memory-prisma")).fakePrisma }));

import { POST as login } from "@/app/api/auth/socio/login/route";
import { fakePrisma } from "../fakes/in-memory-prisma";

const socio = { id: "socio-1", dni: "34123456", nombre: "Juan", apellido: "Pérez", numeroSocio: "SOC-1001", sessionVersion: 0, activo: true };
function post(body: unknown, ip = "203.0.113.10") {
  return new Request("http://localhost/api/auth/socio/login", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": ip }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

beforeEach(() => {
  cookieJar.clear();
  rateCounts.clear();
  fakePrisma.__reset({ socios: [socio] });
});

describe("acceso de socios con DNI como usuario y contraseña", () => {
  it("crea sesión si ambos campos tienen el DNI activo", async () => {
    const response = await login(post({ dni: "34.123.456", password: "34123456" }));
    expect(response.status).toBe(200);
    expect(cookieJar.get("laencontrada_socio_token")?.split(".")).toHaveLength(3);
  });

  it("rechaza una contraseña diferente sin crear sesión", async () => {
    const response = await login(post({ dni: socio.dni, password: "12345678" }));
    expect(response.status).toBe(401);
    expect(cookieJar.size).toBe(0);
  });

  it("no revela si el DNI existe o está inactivo", async () => {
    const unknown = await login(post({ dni: "99887766", password: "99887766" }));
    fakePrisma.__reset({ socios: [{ ...socio, activo: false }] });
    const inactive = await login(post({ dni: socio.dni, password: socio.dni }));
    expect(unknown.status).toBe(401);
    expect(inactive.status).toBe(401);
    expect((await unknown.json()).error).toBe((await inactive.json()).error);
    expect(cookieJar.size).toBe(0);
  });

  it("limita intentos por DNI", async () => {
    for (let index = 0; index < 10; index++) {
      expect((await login(post({ dni: "99887766", password: "99887766" }, `203.0.113.${index + 1}`))).status).toBe(401);
    }
    const blocked = await login(post({ dni: "99887766", password: "99887766" }, "203.0.113.50"));
    expect(blocked.status).toBe(429);
  });

  it("valida la entrada y el JSON", async () => {
    expect((await login(post({ dni: "12ab", password: "12ab" }))).status).toBe(400);
    expect((await login(post({ dni: socio.dni }))).status).toBe(400);
    expect((await login(post("not-json{"))).status).toBe(400);
  });
});
