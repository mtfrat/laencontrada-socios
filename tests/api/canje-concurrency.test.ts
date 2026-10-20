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

import { POST as validarCanje } from "@/app/api/pos/canje/validar/route";
import { POST as crearCanje } from "@/app/api/socio/canje/route";
import { createSocioSession, createStaffSession } from "@/lib/auth";
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

function staffRow(): Row {
  return {
    id: "staff-1",
    username: "mozo1",
    nombre: "Mozo Luis",
    role: "MOZO",
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function premioRow(
  id: string,
  stock: number,
  puntosRequeridos: number,
  titulo = "Botella de vino"
): Row {
  return {
    id,
    titulo,
    descripcion: "Premio de ejemplo",
    puntosRequeridos,
    imagenUrl: null,
    stock,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function canjeRow(
  id: string,
  socioId: string,
  premioId: string,
  codigoQR: string,
  puntosGastados: number,
  overrides: Row = {}
): Row {
  return {
    id,
    socioId,
    premioId,
    validadoPorId: null,
    codigoQR,
    estado: "PENDIENTE",
    puntosGastados,
    fechaExpiracion: new Date(Date.now() + 15 * 60 * 1000),
    fechaCanje: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function scan(codigo: string) {
  return validarCanje(
    new Request("http://localhost/api/pos/canje/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    })
  );
}

function crear(premioId: string) {
  return crearCanje(
    new Request("http://localhost/api/socio/canje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premioId }),
    })
  );
}

function assertInvariants() {
  const snapshot = fakePrisma.__getState();
  for (const socio of snapshot.socios) {
    expect(socio.puntosActuales).toBeGreaterThanOrEqual(0);
  }
  for (const premio of snapshot.premios) {
    expect(premio.stock === -1 || premio.stock >= 0).toBe(true);
  }
}

function seedDefault() {
  fakePrisma.__reset({
    socios: [
      socioRow("socio-a", "34123456", 100),
      socioRow("socio-b", "34123457", 100),
    ],
    usuarios: [staffRow()],
    premios: [premioRow("premio-1", 1, 60)],
    canjes: [
      canjeRow("canje-a", "socio-a", "premio-1", "CANJE-AAAAAA", 60),
      canjeRow("canje-b", "socio-b", "premio-1", "CANJE-BBBBBB", 60),
    ],
  });
}

beforeEach(async () => {
  cookieJar.clear();
  await createStaffSession({
    id: "staff-1",
    username: "mozo1",
    nombre: "Mozo Luis",
    role: "MOZO",
  });
  await createSocioSession({
    id: "socio-a",
    dni: "34123456",
    nombre: "Juan",
    apellido: "Pérez",
    numeroSocio: "SOC-1001",
  });
  seedDefault();
});

describe("POST /api/pos/canje/validar — contrato de respuesta", () => {
  it("validación exitosa conserva el contrato existente", async () => {
    const res = await scan("CANJE-AAAAAA");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.canje).toMatchObject({
      id: "canje-a",
      codigoQR: "CANJE-AAAAAA",
      premio: "Botella de vino",
      puntosDebitado: 60,
      socio: {
        nombre: "Juan Pérez",
        dni: "34123456",
        nuevoSaldo: 40,
      },
      validadoPor: "Mozo Luis",
    });
    expect(body.canje.fechaCanje).toBeTruthy();
    expect(typeof body.message).toBe("string");
    assertInvariants();
  });
});

describe("POST /api/pos/canje/validar — concurrencia", () => {
  it("10 escaneos paralelos del mismo cupón: exactamente 1 gana", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => scan("CANJE-AAAAAA"))
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const successes = bodies.filter((body) => body.success);
    const failures = bodies.filter((body) => !body.success);

    expect(successes).toHaveLength(1);
    expect(successes[0].canje).toMatchObject({
      codigoQR: "CANJE-AAAAAA",
      puntosDebitado: 60,
      socio: { nuevoSaldo: 40 },
    });
    expect(failures).toHaveLength(9);

    responses.forEach((response, index) => {
      if (!bodies[index].success) {
        expect(response.status).toBe(400);
        expect(bodies[index].code).toBe("YA_COMPLETADO");
        expect(typeof bodies[index].error).toBe("string");
      }
    });

    const snapshot = fakePrisma.__getState();
    const canje = snapshot.canjes.find((row) => row.id === "canje-a");
    expect(canje?.estado).toBe("COMPLETADO");
    expect(canje?.fechaCanje).toBeInstanceOf(Date);
    expect(
      snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales
    ).toBe(40);
    expect(snapshot.transacciones).toHaveLength(1);
    expect(snapshot.transacciones[0].puntos).toBe(-60);
    expect(snapshot.premios[0].stock).toBe(0);
    assertInvariants();
  });

  it("carrera por la última unidad de stock: el stock nunca baja de 0", async () => {
    const [resA, resB] = await Promise.all([
      scan("CANJE-AAAAAA"),
      scan("CANJE-BBBBBB"),
    ]);
    const [bodyA, bodyB] = [await resA.json(), await resB.json()];

    const results = [
      { canjeId: "canje-a", socioId: "socio-a", body: bodyA, status: resA.status },
      { canjeId: "canje-b", socioId: "socio-b", body: bodyB, status: resB.status },
    ];

    const winners = results.filter((entry) => entry.body.success);
    const losers = results.filter((entry) => !entry.body.success);

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect(losers[0].body.code).toBe("SIN_STOCK");
    expect(losers[0].status).toBe(400);

    const snapshot = fakePrisma.__getState();
    expect(snapshot.premios[0].stock).toBe(0);

    const winner = winners[0];
    const loser = losers[0];
    expect(
      snapshot.socios.find((row) => row.id === winner.socioId)?.puntosActuales
    ).toBe(40);
    expect(
      snapshot.socios.find((row) => row.id === loser.socioId)?.puntosActuales
    ).toBe(100);
    expect(
      snapshot.canjes.find((row) => row.id === winner.canjeId)?.estado
    ).toBe("COMPLETADO");
    expect(
      snapshot.canjes.find((row) => row.id === loser.canjeId)?.estado
    ).toBe("PENDIENTE");
    expect(snapshot.transacciones).toHaveLength(1);
    assertInvariants();
  });

  it("carrera de saldo: los puntos nunca quedan negativos", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-ilimitado", -1, 60)],
      canjes: [
        canjeRow("canje-1", "socio-a", "premio-ilimitado", "CANJE-111111", 60),
        canjeRow("canje-2", "socio-a", "premio-ilimitado", "CANJE-222222", 60),
      ],
    });

    const [res1, res2] = await Promise.all([
      scan("CANJE-111111"),
      scan("CANJE-222222"),
    ]);
    const [body1, body2] = [await res1.json(), await res2.json()];

    const results = [
      { canjeId: "canje-1", body: body1, status: res1.status },
      { canjeId: "canje-2", body: body2, status: res2.status },
    ];
    const winners = results.filter((entry) => entry.body.success);
    const losers = results.filter((entry) => !entry.body.success);

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect(losers[0].body.code).toBe("SALDO_INSUFICIENTE");
    expect(losers[0].status).toBe(400);

    const snapshot = fakePrisma.__getState();
    expect(
      snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales
    ).toBe(40);
    expect(
      snapshot.canjes.find((row) => row.id === losers[0].canjeId)?.estado
    ).toBe("PENDIENTE");
    expect(snapshot.transacciones).toHaveLength(1);
    assertInvariants();
  });
});

describe("POST /api/socio/canje — concurrencia", () => {
  it("5 solicitudes en paralelo: solo 1 cupón pendiente", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 1, 60)],
      canjes: [],
    });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => crear("premio-1"))
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const successes = bodies.filter((body) => body.success);
    const failures = bodies.filter((body) => !body.success);

    expect(successes).toHaveLength(1);
    expect(successes[0].codigoQR).toMatch(/^CANJE-[A-Z0-9]{6}$/);
    expect(failures).toHaveLength(4);

    failures.forEach((body) => {
      expect(body.code).toBe("CANJE_PENDIENTE");
      expect(typeof body.canjePendienteId).toBe("string");
      expect(typeof body.error).toBe("string");
    });

    responses.forEach((response, index) => {
      if (!bodies[index].success) {
        expect(response.status).toBe(400);
      }
    });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.canjes).toHaveLength(1);
    expect(snapshot.canjes[0].estado).toBe("PENDIENTE");
    expect(snapshot.premios[0].stock).toBe(1);
    assertInvariants();
  });

  it("se rechaza con saldo insuficiente verificado dentro de la transacción", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 50)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 3, 100)],
      canjes: [],
    });

    const res = await crear("premio-1");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, code: "SALDO_INSUFICIENTE" });
    expect(body.error).toContain("50");
    expect(body.error).toContain("100");

    const snapshot = fakePrisma.__getState();
    expect(snapshot.canjes).toHaveLength(0);
    assertInvariants();
  });

  it("no emite cupón cuando el premio está sin stock", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 0, 60)],
      canjes: [],
    });

    const res = await crear("premio-1");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, code: "SIN_STOCK" });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.canjes).toHaveLength(0);
    expect(snapshot.premios[0].stock).toBe(0);
    assertInvariants();
  });

  it("creación y validación simultáneas mantienen el stock en cero o más", async () => {
    fakePrisma.__reset({
      socios: [
        socioRow("socio-a", "34123456", 100),
        socioRow("socio-b", "34123457", 100),
      ],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 1, 60)],
      canjes: [
        canjeRow("canje-b", "socio-b", "premio-1", "CANJE-BBBBBB", 60),
      ],
    });

    const [resCrear, resValidar] = await Promise.all([
      crear("premio-1"),
      scan("CANJE-BBBBBB"),
    ]);
    const [bodyCrear, bodyValidar] = [
      await resCrear.json(),
      await resValidar.json(),
    ];

    expect(bodyValidar.success).toBe(true);
    expect(bodyCrear.success === true || bodyCrear.code === "SIN_STOCK").toBe(
      true
    );

    const snapshot = fakePrisma.__getState();
    expect(snapshot.premios[0].stock).toBe(0);
    expect(
      snapshot.canjes.find((row) => row.id === "canje-b")?.estado
    ).toBe("COMPLETADO");
    const cuponCreado = snapshot.canjes.find(
      (row) => row.socioId === "socio-a"
    );
    if (bodyCrear.success) {
      expect(cuponCreado?.estado).toBe("PENDIENTE");
    } else {
      expect(cuponCreado).toBeUndefined();
    }
    assertInvariants();
  });

  it("creación exitosa conserva el contrato existente", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 2, 60)],
      canjes: [],
    });

    const res = await crear("premio-1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.codigoQR).toMatch(/^CANJE-[A-Z0-9]{6}$/);
    expect(typeof body.canjeId).toBe("string");
    expect(typeof body.fechaExpiracion).toBe("string");
    expect(typeof body.message).toBe("string");

    const snapshot = fakePrisma.__getState();
    expect(snapshot.canjes).toHaveLength(1);
    expect(
      snapshot.socios.find((row) => row.id === "socio-a")?.puntosActuales
    ).toBe(100);
    assertInvariants();
  });
});

describe("POST /api/pos/canje/validar — escaneos inválidos", () => {
  it("código inexistente responde 404 NOT_FOUND", async () => {
    const res = await scan("ZZZZZZ");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(typeof body.error).toBe("string");
  });

  it("código vacío responde 400 CODIGO_REQUERIDO", async () => {
    const res = await scan("   ");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, code: "CODIGO_REQUERIDO" });
  });

  it("cupón expirado responde 400 EXPIRADO y queda marcado en la base", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 1, 60)],
      canjes: [
        canjeRow("canje-e", "socio-a", "premio-1", "CANJE-EEEEEE", 60, {
          fechaExpiracion: new Date(Date.now() - 60 * 1000),
        }),
      ],
    });

    const res = await scan("CANJE-EEEEEE");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, code: "EXPIRADO" });

    const snapshot = fakePrisma.__getState();
    expect(snapshot.canjes[0].estado).toBe("EXPIRADO");
    expect(snapshot.socios[0].puntosActuales).toBe(100);
    assertInvariants();
  });

  it("cupón cancelado responde 400 CANCELADO", async () => {
    fakePrisma.__reset({
      socios: [socioRow("socio-a", "34123456", 100)],
      usuarios: [staffRow()],
      premios: [premioRow("premio-1", 1, 60)],
      canjes: [
        canjeRow("canje-c", "socio-a", "premio-1", "CANJE-CCCCCC", 60, {
          estado: "CANCELADO",
        }),
      ],
    });

    const res = await scan("CANJE-CCCCCC");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, code: "CANCELADO" });
    assertInvariants();
  });

  it("sin sesión de personal responde 401", async () => {
    cookieJar.clear();

    const res = await scan("CANJE-AAAAAA");
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ success: false, code: "UNAUTHORIZED" });
  });
});
