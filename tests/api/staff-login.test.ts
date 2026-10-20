import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
const findUniqueMock = vi.hoisted(() => vi.fn());
const compareMock = vi.hoisted(() => vi.fn());

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
    usuario: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
  },
}));

import { POST } from "@/app/api/auth/staff/login/route";
import { staffLoginIpLimiter } from "@/lib/rate-limit";

const STAFF_COOKIE = "laencontrada_staff_token";

const usuarioAdmin = {
  id: "user-1",
  username: "ana",
  nombre: "Ana",
  role: "ADMIN",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
  activo: true,
};

function loginRequest(body: unknown, ip = "203.0.113.20"): Request {
  return new Request("http://localhost/api/auth/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  cookieJar.clear();
  staffLoginIpLimiter.reset();
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  compareMock.mockReset();
  compareMock.mockResolvedValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/auth/staff/login — validación de entrada", () => {
  it("rechaza credenciales incompletas", async () => {
    const res = await POST(loginRequest({ username: "ana" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      code: "MISSING_CREDENTIALS",
    });
    expect(typeof data.error).toBe("string");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/staff/login — resultados", () => {
  it("rechaza usuarios desconocidos sin comparar contraseñas", async () => {
    const res = await POST(
      loginRequest({ username: "noexiste", password: "secret123" })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toMatchObject({ success: false, code: "INVALID_CREDENTIALS" });
    expect(compareMock).not.toHaveBeenCalled();
    expect(cookieJar.has(STAFF_COOKIE)).toBe(false);
  });

  it("rechaza usuarios inactivos", async () => {
    findUniqueMock.mockResolvedValue({ ...usuarioAdmin, activo: false });

    const res = await POST(loginRequest({ username: "ana", password: "x" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toMatchObject({ success: false, code: "ACCOUNT_DISABLED" });
    expect(cookieJar.has(STAFF_COOKIE)).toBe(false);
  });

  it("rechaza contraseñas incorrectas", async () => {
    findUniqueMock.mockResolvedValue(usuarioAdmin);
    compareMock.mockResolvedValue(false);

    const res = await POST(
      loginRequest({ username: "ana", password: "mala" })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toMatchObject({ success: false, code: "INVALID_CREDENTIALS" });
    expect(cookieJar.has(STAFF_COOKIE)).toBe(false);
  });

  it("crea la sesión y redirige a /admin para ADMIN", async () => {
    findUniqueMock.mockResolvedValue(usuarioAdmin);
    compareMock.mockResolvedValue(true);

    const res = await POST(
      loginRequest({ username: "ana", password: "buena" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toMatchObject({ success: true, redirectTo: "/admin" });
    expect(data.user).toMatchObject({ username: "ana", role: "ADMIN" });
    expect(compareMock).toHaveBeenCalledWith("buena", usuarioAdmin.passwordHash);

    const token = cookieJar.get(STAFF_COOKIE);
    expect(token).toBeTruthy();
    expect((token as string).split(".")).toHaveLength(3);
  });

  it("redirige a /pos para roles no ADMIN", async () => {
    findUniqueMock.mockResolvedValue({ ...usuarioAdmin, role: "MOZO" });
    compareMock.mockResolvedValue(true);

    const res = await POST(
      loginRequest({ username: "ana", password: "buena" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toMatchObject({ success: true, redirectTo: "/pos" });
  });

  it("normaliza el username a minúsculas", async () => {
    findUniqueMock.mockResolvedValue(usuarioAdmin);
    compareMock.mockResolvedValue(true);

    await POST(loginRequest({ username: "  ANA ", password: "buena" }));

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: "ana" } })
    );
  });

  it("devuelve 500 genérico sin filtrar detalles internos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(
      new Error("Authentication failed for host `db.internal.supabase.co`")
    );

    const res = await POST(
      loginRequest({ username: "ana", password: "x" },
      "203.0.113.98")
    );
    const data = await res.json();
    const raw = JSON.stringify(data);

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    for (const leak of [
      "db.internal.supabase.co",
      "PrismaClient",
      "DATABASE_URL",
      "Vercel",
    ]) {
      expect(raw).not.toContain(leak);
    }
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("POST /api/auth/staff/login — rate limiting", () => {
  it("bloquea tras 10 peticiones desde la misma IP", async () => {
    const ip = "198.51.100.10";

    for (let i = 0; i < 10; i++) {
      const res = await POST(
        loginRequest({ username: `user${i}`, password: "x" }, ip)
      );
      expect(res.status).toBe(401);
    }

    const blocked = await POST(
      loginRequest({ username: "ana", password: "x" }, ip)
    );
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data).toMatchObject({ success: false, code: "RATE_LIMITED" });
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(findUniqueMock).toHaveBeenCalledTimes(10);
  });
});
