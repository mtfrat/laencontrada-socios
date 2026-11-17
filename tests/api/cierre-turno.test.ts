import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({ cookies: async () => ({
  set: (name: string, value: string) => cookieJar.set(name, value),
  get: (name: string) => cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  delete: (name: string) => cookieJar.delete(name),
}) }));
vi.mock("@/lib/prisma", async () => {
  const { fakePrisma } = await import("../fakes/in-memory-prisma");
  return { prisma: fakePrisma };
});
vi.mock("@/lib/cierre-upload", () => ({
  parseUploadedCierre: async (request: Request) => {
    const form = await request.formData();
    return {
    form,
    cierre: {
      sucursal: "LE", cuit: "27-23754536-8", fecha: "2026-09-12",
      turnoNumero: 2, turnoNombre: "Noche", cierreNumero: "1011",
      totalVentas: 200000, cantidadFacturas: 1, huellaArchivo: "test",
      tickets: [
        { mesa: "A8", tipoFactura: "FCB", numeroFactura: "0001-00001362", monto: 200000, clave: "27-23754536-8:0001-00001362" },
        ...(form.has("segundaFactura") ? [{ mesa: "A7", tipoFactura: "FCB", numeroFactura: "0001-00001363", monto: 200000, clave: "27-23754536-8:0001-00001363" }] : []),
      ],
    },
  }; },
}));

import { POST as acreditar } from "@/app/api/pos/cierre/acreditar/route";
import { POST as preview } from "@/app/api/pos/cierre/preview/route";
import { createStaffSession } from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

function request(numbers: string[], comensales = 4) {
  const form = new FormData();
  form.set("asignaciones", JSON.stringify({
    pesosPorPunto: 1000,
    asignaciones: [{ numeroFactura: "0001-00001362", comensales, numerosSocio: numbers }],
  }));
  return new Request("http://localhost/api/pos/cierre/acreditar", { method: "POST", body: form });
}

beforeEach(async () => {
  cookieJar.clear();
  fakePrisma.__reset({
    usuarios: [{ id: "staff-1", username: "equipo1", nombre: "Equipo", role: "EQUIPO", passwordHash: "hash", activo: true }],
    socios: [
      { id: "socio-1", dni: "12345678", numeroSocio: "SOC-1001", nombre: "Ana", apellido: null, puntosActuales: 0, puntosHistoricos: 0, activo: true },
      { id: "socio-2", dni: "87654321", numeroSocio: "SOC-1002", nombre: "Luis", apellido: null, puntosActuales: 0, puntosHistoricos: 0, activo: true },
    ],
    config: { pesosPorPunto: 1000 },
  });
  await createStaffSession({ id: "staff-1", username: "equipo1", nombre: "Equipo", role: "EQUIPO" });
});

describe("cierre de turno: acreditar por factura", () => {
  it("reparte $200.000 entre 4 y asigna 50 puntos al único socio", async () => {
    const response = await acreditar(request(["SOC-1001"]));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mesasAcreditadas: 1, sociosAcreditados: 1 });
    const state = fakePrisma.__getState();
    expect(state.socios[0].puntosActuales).toBe(50);
    expect(state.socios[1].puntosActuales).toBe(0);
    expect(state.creditedTickets).toHaveLength(1);
    expect(state.visitas[0].cantidadComensales).toBe(4);
    expect(state.tickets[0].numeroTicketFiscal).toBe("0001-00001362");
  });

  it("da 50 puntos a cada uno de dos socios sin dividir el ticket entre dos", async () => {
    const response = await acreditar(request(["1001", "1002"]));
    expect(response.status).toBe(200);
    const state = fakePrisma.__getState();
    expect(state.socios.map((socio) => socio.puntosActuales)).toEqual([50, 50]);
    expect(state.transacciones.map((tx) => tx.puntos)).toEqual([50, 50]);
    expect(state.visitas).toHaveLength(2);
    expect(state.creditedTickets).toHaveLength(1);
  });

  it("impide acreditar la misma factura dos veces", async () => {
    expect((await acreditar(request(["1001"]))).status).toBe(200);
    const second = await acreditar(request(["1002"]));
    expect(second.status).toBe(409);
    const state = fakePrisma.__getState();
    expect(state.socios.map((socio) => socio.puntosActuales)).toEqual([50, 0]);
    expect(state.creditedTickets).toHaveLength(1);
    const form = new FormData();
    const checked = await preview(new Request("http://localhost/api/pos/cierre/preview", { method: "POST", body: form }));
    expect((await checked.json()).cierre.tickets[0].yaAcreditado).toBe(true);
  });

  it("detecta una factura cargada manualmente antes de importar el PDF", async () => {
    fakePrisma.__reset({
      usuarios: [{ id: "staff-1", username: "equipo1", nombre: "Equipo", role: "EQUIPO", passwordHash: "hash", activo: true }],
      socios: [{ id: "socio-1", dni: "12345678", numeroSocio: "SOC-1001", nombre: "Ana", apellido: null, puntosActuales: 50, puntosHistoricos: 50, activo: true }],
      config: { pesosPorPunto: 1000 },
      creditedTickets: [{ id: "manual-1", clave: "manual:0001-00001362", numeroFactura: "0001-00001362", origen: "MANUAL" }],
    });
    const result = await acreditar(request(["SOC-1001"]));
    expect(result.status).toBe(409);
    const state = fakePrisma.__getState();
    expect(state.transacciones).toHaveLength(0);
    expect(state.creditedTickets).toHaveLength(1);
  });

  it("rechaza socios inexistentes sin acreditar parcialmente", async () => {
    const response = await acreditar(request(["1001", "9999"]));
    expect(response.status).toBe(400);
    const state = fakePrisma.__getState();
    expect(state.socios[0].puntosActuales).toBe(0);
    expect(state.creditedTickets).toHaveLength(0);
    expect(state.visitas).toHaveLength(0);
  });

  it("rechaza un socio repetido en dos facturas del cierre", async () => {
    const form = new FormData();
    form.set("segundaFactura", "1");
    form.set("asignaciones", JSON.stringify({ pesosPorPunto: 1000, asignaciones: [
      { numeroFactura: "0001-00001362", comensales: 4, numerosSocio: ["1001"] },
      { numeroFactura: "0001-00001363", comensales: 4, numerosSocio: ["SOC-1001"] },
    ] }));
    const response = await acreditar(new Request("http://localhost/api/pos/cierre/acreditar", { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(fakePrisma.__getState().creditedTickets).toHaveLength(0);
  });
});
