import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    get: (name: string) =>
      cookieJar.has(name)
        ? { name, value: cookieJar.get(name) as string }
        : undefined,
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

vi.mock("@/lib/prisma", async () => {
  const { fakePrisma } = await import("../fakes/in-memory-prisma");
  return { prisma: fakePrisma };
});

import { POST as altaRapida } from "@/app/api/pos/socios/alta/route";
import { POST as adminCrear } from "@/app/api/admin/socios/route";
import { createStaffSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

type Row = Record<string, any>;

function socioRow(id: string, dni: string, numeroSocio: string): Row {
  return {
    id,
    numeroSocio,
    dni,
    nombre: "Existente",
    apellido: null,
    telefono: null,
    email: null,
    passwordHash: null,
    puntosActuales: 0,
    puntosHistoricos: 0,
    activo: true,
    fechaAlta: new Date(),
    updatedAt: new Date(),
  };
}

function seed(existing: Array<[string, string, string]> = [["socio-1", "11111111", "SOC-1000"]]) {
  fakePrisma.__reset({
    socios: existing.map(([id, dni, numero]) => socioRow(id, dni, numero)),
    usuarios: [
      {
        id: "staff-1",
        username: "admin1",
        nombre: "Admin",
        role: "ADMIN",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
}

function alta(dni: string, nombre = "Nuevo") {
  return altaRapida(
    new Request("http://localhost/api/pos/socios/alta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, nombre }),
    })
  );
}

function adminCreate(dni: string, nombre = "Nuevo") {
  return adminCrear(
    new Request("http://localhost/api/admin/socios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "crear_socio", dni, nombre, puntosIniciales: 0 }),
    })
  );
}

beforeEach(async () => {
  cookieJar.clear();
  await createStaffSession({
    id: "staff-1",
    username: "admin1",
    nombre: "Admin",
    role: "ADMIN",
  });
  seed();
});

describe("POST /api/pos/socios/alta — asignación atómica de numeroSocio", () => {
  it("altas paralelas del mismo DNI crean exactamente 1 socio", async () => {
    const responses = await Promise.all([
      alta("22222222", "Ana"),
      alta("22222222", "Ana"),
      alta("22222222", "Ana"),
    ]);
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const creados = bodies.filter((body) => body.success && !body.yaExistia);
    const existentes = bodies.filter((body) => body.yaExistia);

    expect(creados).toHaveLength(1);
    expect(creados[0].socio.numeroSocio).toBe("SOC-1001");
    expect(existentes).toHaveLength(2);
    for (const body of existentes) {
      expect(body.socio.id).toBe(creados[0].socio.id);
    }

    const snapshot = fakePrisma.__getState();
    expect(snapshot.socios).toHaveLength(2);
    expect(
      snapshot.socios.filter((row) => row.dni === "22222222")
    ).toHaveLength(1);
  });

  it("altas paralelas de DNIs distintos obtienen numerosSocio distintos sin 500", async () => {
    const responses = await Promise.all([
      alta("33333333", "Bruno"),
      alta("44444444", "Carla"),
      alta("55555555", "Diego"),
    ]);
    const bodies = await Promise.all(responses.map((r) => r.json()));

    for (let index = 0; index < bodies.length; index++) {
      expect(responses[index].status).toBe(200);
      expect(bodies[index].success).toBe(true);
    }

    const numeros = bodies.map((body) => body.socio.numeroSocio);
    expect(new Set(numeros).size).toBe(3);
    expect(numeros).toContain("SOC-1001");
    expect(numeros).toContain("SOC-1002");
    expect(numeros).toContain("SOC-1003");

    const snapshot = fakePrisma.__getState();
    expect(snapshot.socios).toHaveLength(4);
  });

  it("DNI duplicado secuencial responde yaExistia", async () => {
    const res = await alta("11111111");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, yaExistia: true });
    expect(body.message).toContain("ya se encontraba registrado");
  });

  it("sin sesión responde 401", async () => {
    cookieJar.clear();

    const res = await alta("22222222");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/socios (crear_socio) — asignación atómica", () => {
  it("altas paralelas del mismo DNI: exactamente 1 crea, el resto recibe 400", async () => {
    const responses = await Promise.all([
      adminCreate("66666666"),
      adminCreate("66666666"),
      adminCreate("66666666"),
    ]);
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const creados = bodies.filter((body) => body.success);
    const rechazados = bodies.filter((body) => !body.success);

    expect(creados).toHaveLength(1);
    expect(creados[0].socio.numeroSocio).toBe("SOC-1001");
    expect(creados[0].socio.passwordHash).toBeUndefined();
    expect(rechazados).toHaveLength(2);
    for (const body of rechazados) {
      expect(body.error).toContain("Ya existe un socio con DNI");
    }

    const snapshot = fakePrisma.__getState();
    expect(
      snapshot.socios.filter((row) => row.dni === "66666666")
    ).toHaveLength(1);
  });

  it("DNI duplicado secuencial responde 400", async () => {
    const res = await adminCreate("11111111");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Ya existe un socio con DNI");
  });
});
