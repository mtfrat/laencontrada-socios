import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const guard = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guards", () => ({ requireStaffSession: () => guard() }));
vi.mock("@/lib/prisma", () => ({ prisma: { mensajeInterno: { findMany: (...args: unknown[]) => findMany(...args), create: (...args: unknown[]) => create(...args) } } }));

import { GET, POST } from "@/app/api/staff/chat/route";

function request(body: unknown) {
  return new Request("http://localhost/api/staff/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  guard.mockReset().mockResolvedValue({ ok: true, session: { id: "staff-1", nombre: "Luis", role: "MOZO" } });
  findMany.mockReset().mockResolvedValue([]);
  create.mockReset().mockImplementation(({ data }) => ({ id: "msg-1", ...data, createdAt: new Date() }));
});

describe("chat privado del personal", () => {
  it("rechaza lectura y envío sin sesión de staff", async () => {
    guard.mockResolvedValue({ ok: false, response: NextResponse.json({ success: false }, { status: 401 }) });
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ contenido: "Hola" }))).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("usa la identidad de la sesión al enviar, aunque el cuerpo intente suplantarla", async () => {
    const response = await POST(request({ contenido: "  Hola equipo  ", autorId: "otro-usuario", autorNombre: "Falso" }));
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: {
      autorId: "staff-1", autorNombre: "Luis", contenido: "Hola equipo",
    } }));
  });

  it("rechaza mensajes vacíos o demasiado largos", async () => {
    expect((await POST(request({ contenido: "   " }))).status).toBe(400);
    expect((await POST(request({ contenido: "x".repeat(2001) }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
