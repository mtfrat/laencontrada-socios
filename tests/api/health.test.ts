import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
  },
}));

import { GET } from "@/app/api/health/route";

beforeEach(() => {
  queryRawMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/health", () => {
  it("responde OK sin exponer diagnóstico del entorno", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://user:password@db.example.internal:5432/postgres"
    );
    queryRawMock.mockResolvedValue([{ ok: 1 }]);

    const res = await GET();
    const data = await res.json();
    const raw = JSON.stringify(data);

    expect(res.status).toBe(200);
    expect(data.status).toBe("OK");
    expect(typeof data.timestamp).toBe("string");
    expect(raw).not.toContain("envCheck");
    expect(raw).not.toContain("totalSocios");
    expect(raw).not.toContain("pesosPorPunto");
    expect(raw).not.toContain("db.example.internal");
    expect(raw).not.toContain("password");
  });

  it("responde CONFIG_MISSING sin guías de operación ni variables", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DATABASE_URL", "");

    const res = await GET();
    const data = await res.json();
    const raw = JSON.stringify(data);

    expect(res.status).toBe(500);
    expect(data).toEqual({ status: "ERROR", code: "CONFIG_MISSING" });
    expect(raw).not.toContain("Vercel");
    expect(raw).not.toContain("envCheck");
    expect(consoleSpy).toHaveBeenCalled();
    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("responde DB_UNAVAILABLE sin filtrar el error de la base de datos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@db.example:5432/postgres");
    queryRawMock.mockRejectedValue(
      new Error("Authentication failed for user `app` at host `db.internal`")
    );

    const res = await GET();
    const data = await res.json();
    const raw = JSON.stringify(data);

    expect(res.status).toBe(503);
    expect(data).toEqual({ status: "ERROR", code: "DB_UNAVAILABLE" });
    expect(raw).not.toContain("db.internal");
    expect(raw).not.toContain("Authentication failed");
    expect(raw).not.toContain("errorDetalle");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("verifica la conexión con SELECT 1", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@db.example:5432/postgres");
    queryRawMock.mockResolvedValue([{ ok: 1 }]);

    await GET();

    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });
});
