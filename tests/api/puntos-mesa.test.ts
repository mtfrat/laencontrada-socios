import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string) => cookieJar.set(name, value),
    get: (name: string) => cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    delete: (name: string) => cookieJar.delete(name),
  }),
}));
vi.mock("@/lib/prisma", async () => {
  const { fakePrisma } = await import("../fakes/in-memory-prisma");
  return { prisma: fakePrisma };
});

import { POST } from "@/app/api/pos/puntos/route";
import { createStaffSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

function socio(id: string, activo = true) {
  return { id, dni: id, numeroSocio: id, nombre: id, apellido: null, puntosActuales: 5, puntosHistoricos: 5, activo };
}

function acreditar(sociosIds: string[], montoTotalTicket = 40000, numeroFactura = "0001-00001362") {
  return POST(new Request("http://localhost/api/pos/puntos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroFactura, montoTotalTicket, cantidadComensales: 4, sociosIds }),
  }));
}

beforeEach(async () => {
  cookieJar.clear();
  fakePrisma.__reset({
    usuarios: [{ id: "staff-1", username: "mozo1", nombre: "Luis", role: "MOZO", passwordHash: "hash", activo: true }],
    socios: [socio("socio-1"), socio("socio-2"), socio("socio-3", false)],
    config: { pesosPorPunto: 1000 },
  });
  await createStaffSession({ id: "staff-1", username: "mozo1", nombre: "Luis", role: "MOZO" });
});

describe("acreditación de puntos por mesa", () => {
  it("acredita a cada socio presente y registra transacción y visita", async () => {
    const res = await acreditar(["socio-1", "socio-2"]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.puntosPorSocio).toBe(10);
    expect(body.data.sociosAcreditados).toHaveLength(2);
    const state = fakePrisma.__getState();
    expect(state.socios.filter((row) => row.activo).map((row) => row.puntosActuales)).toEqual([15, 15]);
    expect(state.transacciones).toHaveLength(2);
    expect(state.transacciones.every((row) => row.tipo === "CONSUMO" && row.puntos === 10 && row.registradoPorId === "staff-1")).toBe(true);
    expect(state.visitas).toHaveLength(2);
    expect(state.creditedTickets).toHaveLength(1);
    expect(state.creditedTickets[0].numeroFactura).toBe("0001-00001362");
    expect(state.tickets.map((row) => row.numeroTicketFiscal)).toEqual(["0001-00001362", "0001-00001362"]);
  });

  it("rechaza acreditar una factura manual dos veces sin alterar saldos", async () => {
    expect((await acreditar(["socio-1"])).status).toBe(200);
    const duplicado = await acreditar(["socio-2"]);
    expect(duplicado.status).toBe(409);
    expect((await duplicado.json()).code).toBe("TICKET_DUPLICADO");
    const state = fakePrisma.__getState();
    expect(state.socios.map((row) => row.puntosActuales)).toEqual([15, 5, 5]);
    expect(state.creditedTickets).toHaveLength(1);
    expect(state.transacciones).toHaveLength(1);
  });

  it("rechaza intentos concurrentes para la misma factura", async () => {
    const responses = await Promise.all([
      acreditar(["socio-1"]),
      acreditar(["socio-2"]),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const state = fakePrisma.__getState();
    expect(state.creditedTickets).toHaveLength(1);
    expect(state.transacciones).toHaveLength(1);
  });

  it("no acredita manualmente una factura importada por PDF", async () => {
    fakePrisma.__reset({
      usuarios: [{ id: "staff-1", username: "mozo1", nombre: "Luis", role: "MOZO", passwordHash: "hash", activo: true }],
      socios: [socio("socio-1")],
      config: { pesosPorPunto: 1000 },
      creditedTickets: [{ id: "pdf-1", clave: "27-12345678-9:0001-00001362", numeroFactura: "0001-00001362", origen: "CIERRE_PDF" }],
    });
    expect((await acreditar(["socio-1"])).status).toBe(409);
    expect(fakePrisma.__getState().transacciones).toHaveLength(0);
  });

  it("exige un número fiscal completo", async () => {
    expect((await acreditar(["socio-1"], 40000, "1362")).status).toBe(400);
    expect(fakePrisma.__getState().creditedTickets).toHaveLength(0);
  });

  it.each([
    { ids: ["socio-1", "socio-1"], monto: 40000 },
    { ids: ["socio-1", "socio-3"], monto: 40000 },
    { ids: ["socio-1", "inexistente"], monto: 40000 },
    { ids: ["socio-1"], monto: 3000 },
  ])("rechaza mesas inválidas sin acreditar parcialmente: $ids", async ({ ids, monto }) => {
    const res = await acreditar(ids, monto);
    expect(res.status).toBe(400);
    const state = fakePrisma.__getState();
    expect(state.transacciones).toHaveLength(0);
    expect(state.visitas).toHaveLength(0);
    expect(state.socios.map((row) => row.puntosActuales)).toEqual([5, 5, 5]);
  });
});
