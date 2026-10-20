import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
const findUniqueMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socio: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { POST } from "@/app/api/auth/socio/login/route";
import { socioLoginDniLimiter, socioLoginIpLimiter } from "@/lib/rate-limit";

const SOCIO_COOKIE = "laencontrada_socio_token";

const socioActivo = {
  id: "socio-1",
  dni: "34123456",
  nombre: "Juan",
  apellido: "Pérez",
  numeroSocio: "SOC-1001",
  puntosActuales: 120,
  puntosHistoricos: 340,
  activo: true,
};

function loginRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/auth/socio/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  cookieJar.clear();
  socioLoginIpLimiter.reset();
  socioLoginDniLimiter.reset();
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/auth/socio/login — validación de entrada", () => {
  it("rechaza la petición sin DNI", async () => {
    const res = await POST(loginRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toMatchObject({ success: false, code: "DNI_REQUIRED" });
    expect(typeof data.error).toBe("string");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rechaza un DNI demasiado corto", async () => {
    const res = await POST(loginRequest({ dni: "123" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toMatchObject({ success: false, code: "DNI_INVALID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rechaza un DNI con letras", async () => {
    const res = await POST(loginRequest({ dni: "12ab34" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toMatchObject({ success: false, code: "DNI_INVALID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("normaliza puntos y guiones antes de buscar", async () => {
    const res = await POST(loginRequest({ dni: "34.123-456" }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
    expect(data.error).toContain("34123456");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dni: "34123456" } })
    );
  });
});

describe("POST /api/auth/socio/login — resultados", () => {
  it("crea la sesión de socio en una búsqueda exitosa", async () => {
    findUniqueMock.mockResolvedValue(socioActivo);

    const res = await POST(loginRequest({ dni: "34123456" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.socio).toMatchObject({
      numeroSocio: "SOC-1001",
      puntosActuales: 120,
    });

    const token = cookieJar.get(SOCIO_COOKIE);
    expect(token).toBeTruthy();
    expect((token as string).split(".")).toHaveLength(3);
  });

  it("rechaza socios inactivos sin crear cookie", async () => {
    findUniqueMock.mockResolvedValue({ ...socioActivo, activo: false });

    const res = await POST(loginRequest({ dni: "34123456" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toMatchObject({ success: false, code: "ACCOUNT_DISABLED" });
    expect(cookieJar.has(SOCIO_COOKIE)).toBe(false);
  });

  it("devuelve 404 con mensaje claro cuando el DNI no existe", async () => {
    const res = await POST(loginRequest({ dni: "99999999" }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(cookieJar.has(SOCIO_COOKIE)).toBe(false);
  });

  it("devuelve 500 genérico sin filtrar detalles internos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(
      new Error("Can't reach database server at `db.abc.supabase.co:5432`")
    );

    const res = await POST(loginRequest({ dni: "34123456" }, "203.0.113.99"));
    const data = await res.json();
    const raw = JSON.stringify(data);

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    for (const leak of [
      "db.abc.supabase.co",
      "PrismaClient",
      "DATABASE_URL",
      "Vercel",
      "5432",
    ]) {
      expect(raw).not.toContain(leak);
    }
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("devuelve 500 genérico con cuerpo JSON inválido", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(loginRequest("not-json{", "203.0.113.50"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toMatchObject({ success: false, code: "INTERNAL_ERROR" });
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("POST /api/auth/socio/login — rate limiting", () => {
  it("bloquea tras 5 intentos con el mismo DNI", async () => {
    const ip = "198.51.100.1";

    for (let i = 0; i < 5; i++) {
      const res = await POST(loginRequest({ dni: "34123456" }, ip));
      expect(res.status).toBe(404);
    }
    expect(findUniqueMock).toHaveBeenCalledTimes(5);

    const blocked = await POST(loginRequest({ dni: "34123456" }, ip));
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data).toMatchObject({ success: false, code: "RATE_LIMITED" });
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(data.error).not.toContain("34123456");
    expect(findUniqueMock).toHaveBeenCalledTimes(5);
  });

  it("bloquea tras 30 peticiones desde la misma IP aunque cambie el DNI", async () => {
    const ip = "198.51.100.2";

    for (let i = 0; i < 30; i++) {
      const res = await POST(loginRequest({ dni: String(90000000 + i) }, ip));
      expect(res.status).toBe(404);
    }

    const blocked = await POST(loginRequest({ dni: "34123456" }, ip));
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("el límite por DNI resiste rotación de IP y otra IP no hereda el bloqueo", async () => {
    const blockedIp = "198.51.100.3";
    for (let i = 0; i < 5; i++) {
      await POST(loginRequest({ dni: "34123456" }, blockedIp));
    }
    const blockedSameIp = await POST(
      loginRequest({ dni: "34123456" }, blockedIp)
    );
    expect(blockedSameIp.status).toBe(429);

    const rotatedIp = await POST(
      loginRequest({ dni: "34123456" }, "198.51.100.90")
    );
    expect(rotatedIp.status).toBe(429);

    findUniqueMock.mockResolvedValue(socioActivo);
    const other = await POST(
      loginRequest({ dni: "11223344" }, "198.51.100.4")
    );
    expect(other.status).toBe(200);
  });
});
