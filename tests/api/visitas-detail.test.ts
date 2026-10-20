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

import { GET, PUT } from "@/app/api/visitas/[id]/route";
import { createStaffSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

type Row = Record<string, any>;

const HASH_SOCIO = "$2b$10$hashsecretdelsocio00000000000000000000000000000000000";
const HASH_STAFF = "$2b$10$hashsecretdelstaff00000000000000000000000000000000000";

function seed() {
  fakePrisma.__reset({
    socios: [
      {
        id: "socio-a",
        numeroSocio: "SOC-1001",
        dni: "34123456",
        nombre: "Juan",
        apellido: "Pérez",
        telefono: "1155555555",
        email: "juan@example.com",
        passwordHash: HASH_SOCIO,
        puntosActuales: 100,
        puntosHistoricos: 150,
        activo: true,
        fechaAlta: new Date(),
        updatedAt: new Date(),
      },
    ],
    usuarios: [
      {
        id: "staff-1",
        username: "mozo1",
        nombre: "Mozo Luis",
        role: "MOZO",
        passwordHash: HASH_STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    visitas: [
      {
        id: "visita-1",
        socioId: "socio-a",
        registradoPorId: "staff-1",
        fechaVisita: new Date(),
        franjaHoraria: "CENA",
        montoTotalTicket: 15000,
        cantidadComensales: 2,
        gastoPromedioPorPersona: 7500,
        puntosAcreditados: 50,
        notas: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    platos: [
      {
        id: "plato-1",
        visitaConsumoId: "visita-1",
        nombrePlato: "Milanesa",
        cantidad: 1,
        notas: null,
      },
    ],
    tickets: [
      {
        id: "ticket-1",
        visitaConsumoId: "visita-1",
        numeroTicketFiscal: "T-001",
        urlArchivo: null,
        createdAt: new Date(),
      },
    ],
  });
}

function getVisita() {
  return GET(
    new Request("http://localhost/api/visitas/visita-1"),
    { params: Promise.resolve({ id: "visita-1" }) }
  );
}

function putVisita(body: Row) {
  return PUT(
    new Request("http://localhost/api/visitas/visita-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "visita-1" }) }
  );
}

beforeEach(async () => {
  cookieJar.clear();
  await createStaffSession({
    id: "staff-1",
    username: "mozo1",
    nombre: "Mozo Luis",
    role: "MOZO",
  });
  seed();
});

describe("GET /api/visitas/[id]", () => {
  it("devuelve el detalle sin exponer passwordHash", async () => {
    const res = await getVisita();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.visita.socio).toMatchObject({
      nombre: "Juan",
      apellido: "Pérez",
      dni: "34123456",
      numeroSocio: "SOC-1001",
    });
    expect(body.visita.registradoPor).toMatchObject({
      nombre: "Mozo Luis",
      username: "mozo1",
    });
    expect(body.visita.platos).toHaveLength(1);
    expect(body.visita.ticketAdjunto.numeroTicketFiscal).toBe("T-001");

    const serializado = JSON.stringify(body);
    expect(serializado).not.toContain("passwordHash");
    expect(serializado).not.toContain(HASH_SOCIO);
    expect(serializado).not.toContain(HASH_STAFF);
  });

  it("sin sesión de personal responde 401", async () => {
    cookieJar.clear();

    const res = await getVisita();
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/visitas/[id]", () => {
  it("actualiza platos y ticket sin exponer passwordHash", async () => {
    const res = await putVisita({
      notas: "Mesa de cumpleaños",
      platos: [
        { nombrePlato: "Milanesa", cantidad: 2 },
        { nombrePlato: " Flan ", cantidad: 1 },
      ],
      numeroTicketFiscal: "T-999",
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.visita.notas).toBe("Mesa de cumpleaños");
    expect(body.visita.platos).toHaveLength(2);
    expect(body.visita.platos.map((p: Row) => p.nombrePlato).sort()).toEqual([
      "Flan",
      "Milanesa",
    ]);
    expect(body.visita.ticketAdjunto.numeroTicketFiscal).toBe("T-999");

    const serializado = JSON.stringify(body);
    expect(serializado).not.toContain("passwordHash");
    expect(serializado).not.toContain(HASH_SOCIO);
    expect(serializado).not.toContain(HASH_STAFF);

    const snapshot = fakePrisma.__getState();
    expect(snapshot.platos).toHaveLength(2);
    expect(snapshot.tickets[0].numeroTicketFiscal).toBe("T-999");
  });

  it("visita inexistente responde 404", async () => {
    fakePrisma.__reset({
      socios: [],
      usuarios: [
        {
          id: "staff-1",
          username: "mozo1",
          nombre: "Mozo Luis",
          role: "MOZO",
          passwordHash: HASH_STAFF,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      visitas: [],
    });

    const res = await putVisita({ notas: "nada" });
    expect(res.status).toBe(404);
  });
});
