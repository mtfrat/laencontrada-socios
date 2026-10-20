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

import { GET, POST } from "@/app/api/socio/encuesta/[visitaId]/route";
import { createSocioSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

type Row = Record<string, any>;

function socioRow(id: string, dni: string, puntosActuales: number): Row {
  return {
    id,
    numeroSocio: `SOC-${dni}`,
    dni,
    nombre: "Juan",
    apellido: "Pérez",
    telefono: null,
    email: null,
    passwordHash: null,
    puntosActuales,
    puntosHistoricos: puntosActuales,
    activo: true,
    fechaAlta: new Date(),
    updatedAt: new Date(),
  };
}

function visitaRow(id: string, socioId: string, overrides: Row = {}): Row {
  return {
    id,
    socioId,
    registradoPorId: null,
    fechaVisita: new Date(),
    franjaHoraria: "CENA",
    montoTotalTicket: 15000,
    cantidadComensales: 2,
    gastoPromedioPorPersona: 7500,
    puntosAcreditados: 50,
    notas: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function preguntaRow(id: string, orden: number): Row {
  return {
    id,
    texto: `¿Cómo calificarías la ${orden}?`,
    activa: true,
    orden,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function configRow(overrides: Row = {}): Row {
  return {
    pesosPorPunto: 1000,
    puntosPorEncuesta: 10,
    minutosValidezQRCanje: 15,
    encuestaActiva: true,
    encuestaUnaVezPorSocio: true,
    ...overrides,
  };
}

function enviarEncuesta(visitaId: string) {
  return POST(
    new Request(`http://localhost/api/socio/encuesta/${visitaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respuestas: [{ preguntaId: "pregunta-1", puntuacion: 5 }],
        comentarios: "Muy buena experiencia",
      }),
    }),
    { params: Promise.resolve({ visitaId }) }
  );
}

function seedDefault(overrides: { config?: Row | null } = {}) {
  fakePrisma.__reset({
    socios: [
      socioRow("socio-a", "34123456", 100),
      socioRow("socio-b", "34123457", 50),
    ],
    visitas: [
      visitaRow("visita-1", "socio-a"),
      visitaRow("visita-2", "socio-a"),
      visitaRow("visita-3", "socio-b"),
    ],
    preguntas: [preguntaRow("pregunta-1", 1)],
    config:
      overrides.config === undefined ? configRow() : overrides.config,
  });
}

function assertInvariants() {
  const snapshot = fakePrisma.__getState();
  for (const socio of snapshot.socios) {
    expect(socio.puntosActuales).toBeGreaterThanOrEqual(0);
  }
  const respuestasPorVisita = new Map<string, number>();
  for (const respuesta of snapshot.respuestas) {
    const total = (respuestasPorVisita.get(respuesta.visitaConsumoId) ?? 0) + 1;
    respuestasPorVisita.set(respuesta.visitaConsumoId, total);
    expect(total).toBeLessThanOrEqual(1);
  }
}

beforeEach(async () => {
  cookieJar.clear();
  await createSocioSession({
    id: "socio-a",
    dni: "34123456",
    nombre: "Juan",
    apellido: "Pérez",
    numeroSocio: "SOC-1001",
  });
  seedDefault();
});

describe("POST /api/socio/encuesta/[visitaId] — contrato de respuesta", () => {
  it("envío exitoso conserva el contrato existente", async () => {
    const res = await enviarEncuesta("visita-1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.puntosGanados).toBe(10);
    expect(typeof body.respuestaId).toBe("string");

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(1);
    expect(snapshot.respuestaItems).toHaveLength(1);
    expect(snapshot.respuestaItems[0].puntuacion).toBe(5);
    expect(snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales).toBe(110);
    expect(snapshot.transacciones).toHaveLength(1);
    expect(snapshot.transacciones[0].tipo).toBe("ENCUESTA");
    expect(snapshot.transacciones[0].puntos).toBe(10);
    assertInvariants();
  });
});

describe("POST /api/socio/encuesta/[visitaId] — concurrencia", () => {
  it("5 envíos paralelos de la misma visita: exactamente 1 acredita puntos", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => enviarEncuesta("visita-1"))
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const successes = bodies.filter((body) => body.success);
    const failures = bodies.filter((body) => !body.success);

    expect(successes).toHaveLength(1);
    expect(successes[0].puntosGanados).toBe(10);
    expect(failures).toHaveLength(4);

    responses.forEach((response, index) => {
      if (!bodies[index].success) {
        expect(response.status).toBe(400);
        expect(bodies[index].code).toBe("ENCUESTA_YA_RESPONDIDA");
        expect(typeof bodies[index].error).toBe("string");
      }
    });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(1);
    expect(snapshot.respuestaItems).toHaveLength(1);
    expect(snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales).toBe(110);
    expect(snapshot.transacciones).toHaveLength(1);
    assertInvariants();
  });

  it("envíos paralelos de 2 visitas distintas con 'solo 1 vez por socio': exactamente 1 acredita", async () => {
    const [res1, res2] = await Promise.all([
      enviarEncuesta("visita-1"),
      enviarEncuesta("visita-2"),
    ]);
    const [body1, body2] = [await res1.json(), await res2.json()];

    const results = [
      { visitaId: "visita-1", body: body1, status: res1.status },
      { visitaId: "visita-2", body: body2, status: res2.status },
    ];
    const winners = results.filter((entry) => entry.body.success);
    const losers = results.filter((entry) => !entry.body.success);

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect(losers[0].body.code).toBe("SOLO_UNA_VEZ");
    expect(losers[0].status).toBe(400);

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(1);
    expect(snapshot.respuestas[0].visitaConsumoId).toBe(winners[0].visitaId);
    expect(snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales).toBe(110);
    expect(snapshot.transacciones).toHaveLength(1);
    assertInvariants();
  });

  it("con 'solo 1 vez por socio' desactivado, visitas distintas acreditan ambas", async () => {
    seedDefault({ config: configRow({ encuestaUnaVezPorSocio: false }) });

    const [res1, res2] = await Promise.all([
      enviarEncuesta("visita-1"),
      enviarEncuesta("visita-2"),
    ]);
    const [body1, body2] = [await res1.json(), await res2.json()];

    expect(body1.success).toBe(true);
    expect(body2.success).toBe(true);

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(2);
    expect(snapshot.transacciones).toHaveLength(2);
    expect(snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales).toBe(120);
    assertInvariants();
  });
});

describe("POST /api/socio/encuesta/[visitaId] — guards", () => {
  it("segundo envío secuencial de la misma visita responde 400", async () => {
    const first = await enviarEncuesta("visita-1");
    expect((await first.json()).success).toBe(true);

    const res = await enviarEncuesta("visita-1");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      code: "ENCUESTA_YA_RESPONDIDA",
    });
    assertInvariants();
  });

  it("visita de otro socio responde 404 sin acreditar puntos", async () => {
    const res = await enviarEncuesta("visita-3");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toMatchObject({
      success: false,
      code: "VISITA_NO_ENCONTRADA",
    });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(0);
    expect(snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales).toBe(100);
    assertInvariants();
  });

  it("encuestas pausadas responden 403", async () => {
    seedDefault({ config: configRow({ encuestaActiva: false }) });

    const res = await enviarEncuesta("visita-1");
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toMatchObject({ success: false, code: "ENCUESTA_PAUSADA" });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.respuestas).toHaveLength(0);
    assertInvariants();
  });

  it("sin sesión de socio responde 401", async () => {
    cookieJar.clear();

    const res = await enviarEncuesta("visita-1");
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ success: false, error: "No autorizado." });
  });

  it("sin respuestas en el body responde 400", async () => {
    const res = await POST(
      new Request("http://localhost/api/socio/encuesta/visita-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: [] }),
      }),
      { params: Promise.resolve({ visitaId: "visita-1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe("GET /api/socio/encuesta/[visitaId]", () => {
  it("sin sesión responde 401", async () => {
    cookieJar.clear();

    const res = await GET(
      new Request("http://localhost/api/socio/encuesta/visita-1"),
      { params: Promise.resolve({ visitaId: "visita-1" }) }
    );

    expect(res.status).toBe(401);
  });
});
