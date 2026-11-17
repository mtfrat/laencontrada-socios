import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy as middleware } from "../src/proxy";

const SECRET = "test-secret-de-mas-de-32-caracteres-0123456789";

function staffToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    {
      id: "staff-1",
      username: "mozo1",
      nombre: "Mozo Luis",
      role: "MOZO",
      type: "STAFF",
      ...overrides,
    },
    SECRET,
    { expiresIn: "1h" }
  );
}

function socioToken() {
  return jwt.sign(
    {
      id: "socio-a",
      dni: "34123456",
      nombre: "Juan",
      numeroSocio: "SOC-1001",
      type: "SOCIO",
    },
    SECRET,
    { expiresIn: "1h" }
  );
}

function run(path: string, cookies: Array<{ name: string; value: string }> = []) {
  const headers = new Headers();
  if (cookies.length > 0) {
    headers.set(
      "cookie",
      cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
    );
  }
  const request = new NextRequest(new URL(`http://localhost${path}`), {
    headers,
  });
  return middleware(request);
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", SECRET);
});

describe("middleware — protección gruesa de rutas", () => {
  it("el login de socios no redirige hacia sí mismo, incluso con una cookie inválida", () => {
    for (const cookies of [[], [{ name: "laencontrada_socio_token", value: "expired" }]]) {
      const response = run("/socio/login", cookies);
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
    expect(run("/socio/login/privado").status).toBe(307);
  });
  it("API staff sin token responde 401", () => {
    const response = run("/api/pos/puntos") as any;
    expect(response.status).toBe(401);
  });

  it("API staff con token staff válido pasa", () => {
    const response = run("/api/pos/puntos", [
      { name: "laencontrada_staff_token", value: staffToken() },
    ]) as any;
    expect(response.status).toBe(200);
  });

  it("API staff con token de socio responde 401", () => {
    const response = run("/api/pos/puntos", [
      { name: "laencontrada_socio_token", value: socioToken() },
    ]) as any;
    expect(response.status).toBe(401);
  });

  it("reserva la página y API del chat al personal", () => {
    expect(run("/staff/chat").status).toBe(307);
    expect(run("/api/staff/chat").status).toBe(401);
    expect(run("/api/staff/chat", [{ name: "laencontrada_socio_token", value: socioToken() }]).status).toBe(401);
    expect(run("/staff/chat", [{ name: "laencontrada_staff_token", value: staffToken() }]).status).toBe(200);
  });

  it("API socio sin token responde 401", () => {
    const response = run("/api/socio/premios") as any;
    expect(response.status).toBe(401);
  });

  it("API socio con token socio válido pasa", () => {
    const response = run("/api/socio/premios", [
      { name: "laencontrada_socio_token", value: socioToken() },
    ]) as any;
    expect(response.status).toBe(200);
  });

  it("página /pos sin token redirige a /staff/login", () => {
    const response = run("/pos") as any;
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/staff/login");
  });

  it("página /socio sin token redirige a /socio/login", () => {
    const response = run("/socio/premios") as any;
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/socio/login");
  });

  it("rutas públicas no se ven afectadas", () => {
    const response = run("/") as any;
    expect(response.status).toBe(200);
    const login = run("/api/auth/staff/login") as any;
    expect(login.status).toBe(200);
  });

  it("token con firma inválida es rechazado", () => {
    const forged = jwt.sign({ type: "STAFF" }, "otro-secreto-completamente-distinto");
    const response = run("/api/pos/puntos", [
      { name: "laencontrada_staff_token", value: forged },
    ]) as any;
    expect(response.status).toBe(401);
  });

  it("sin SESSION_SECRET el middleware falla cerrado con 500", () => {
    vi.stubEnv("SESSION_SECRET", "");
    const response = run("/api/pos/puntos", [
      { name: "laencontrada_staff_token", value: staffToken() },
    ]) as any;
    expect(response.status).toBe(500);
  });
});
