import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import {
  clearSocioSession,
  createSocioSession,
  createStaffSession,
  getSocioSession,
  getStaffSession,
} from "@/lib/auth";
import { fakePrisma } from "../fakes/in-memory-prisma";

vi.mock("@/lib/prisma", async () => {
  const { fakePrisma: fake } = await import("../fakes/in-memory-prisma");
  return { prisma: fake };
});

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

const SOCIO_COOKIE = "laencontrada_socio_token";
const STAFF_COOKIE = "laencontrada_staff_token";
const SECRET = process.env.SESSION_SECRET as string;

function restoreSessionSecret(original: string | undefined) {
  if (original === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = original;
  }
}

describe("auth: secreto de sesión (fail-closed)", () => {
  it("no arranca si falta SESSION_SECRET", async () => {
    vi.resetModules();
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      await expect(import("@/lib/auth")).rejects.toThrow(/SESSION_SECRET/);
    } finally {
      restoreSessionSecret(original);
      vi.resetModules();
    }
  });

  it("no arranca si SESSION_SECRET es demasiado corto", async () => {
    vi.resetModules();
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "secreto-corto";
    try {
      await expect(import("@/lib/auth")).rejects.toThrow(/32 caracteres/);
    } finally {
      restoreSessionSecret(original);
      vi.resetModules();
    }
  });

  it("arranca con un SESSION_SECRET válido", async () => {
    vi.resetModules();
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "un-seguro-pero-largo-suficiente-1234567890";
    try {
      await expect(import("@/lib/auth")).resolves.toBeDefined();
    } finally {
      restoreSessionSecret(original);
      vi.resetModules();
    }
  });
});

describe("auth: sesiones", () => {
  beforeEach(() => {
    cookieJar.clear();
    fakePrisma.__reset({
      socios: [
        {
          id: "socio-1",
          numeroSocio: "SOC-1001",
          dni: "34123456",
          nombre: "Juan",
          apellido: "Pérez",
          telefono: null,
          email: null,
          passwordHash: null,
          puntosActuales: 100,
          puntosHistoricos: 100,
          activo: true,
          fechaAlta: new Date(),
          updatedAt: new Date(),
        },
      ],
      usuarios: [
        {
          id: "user-1",
          username: "ana",
          nombre: "Ana",
          role: "ADMIN",
          passwordHash: "hash",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  it("crea y verifica una sesión de socio", async () => {
    await createSocioSession({
      id: "socio-1",
      dni: "34123456",
      nombre: "Juan",
      apellido: "Pérez",
      numeroSocio: "SOC-1001",
    });

    const session = await getSocioSession();
    expect(session).toMatchObject({
      id: "socio-1",
      type: "SOCIO",
      numeroSocio: "SOC-1001",
    });
  });

  it("crea y verifica una sesión de staff", async () => {
    await createStaffSession({
      id: "user-1",
      username: "ana",
      nombre: "Ana",
      role: "ADMIN",
    });

    const session = await getStaffSession();
    expect(session).toMatchObject({
      id: "user-1",
      type: "STAFF",
      role: "ADMIN",
    });
  });

  it("rechaza tokens firmados con otro secreto", async () => {
    const forged = jwt.sign(
      {
        id: "socio-1",
        dni: "34123456",
        nombre: "Juan",
        numeroSocio: "SOC-1001",
        type: "SOCIO",
      },
      "attacker-secret",
      { expiresIn: "1h" }
    );
    cookieJar.set(SOCIO_COOKIE, forged);

    expect(await getSocioSession()).toBeNull();
  });

  it("rechaza tokens manipulados", async () => {
    await createSocioSession({
      id: "socio-1",
      dni: "34123456",
      nombre: "Juan",
      apellido: null,
      numeroSocio: "SOC-1001",
    });

    const token = cookieJar.get(SOCIO_COOKIE) as string;
    cookieJar.set(SOCIO_COOKIE, `${token}tampered`);

    expect(await getSocioSession()).toBeNull();
  });

  it("no acepta un token de staff dentro de la cookie de socio", async () => {
    const staffToken = jwt.sign(
      {
        id: "user-1",
        username: "ana",
        nombre: "Ana",
        role: "ADMIN",
        type: "STAFF",
      },
      SECRET,
      { expiresIn: "1h" }
    );
    cookieJar.set(SOCIO_COOKIE, staffToken);

    expect(await getSocioSession()).toBeNull();
  });

  it("no acepta un token de socio dentro de la cookie de staff", async () => {
    const socioToken = jwt.sign(
      {
        id: "socio-1",
        dni: "34123456",
        nombre: "Juan",
        numeroSocio: "SOC-1001",
        type: "SOCIO",
      },
      SECRET,
      { expiresIn: "1h" }
    );
    cookieJar.set(STAFF_COOKIE, socioToken);

    expect(await getStaffSession()).toBeNull();
  });

  it("devuelve null sin cookie", async () => {
    expect(await getSocioSession()).toBeNull();
    expect(await getStaffSession()).toBeNull();
  });

  it("cierra la sesión de socio", async () => {
    await createSocioSession({
      id: "socio-1",
      dni: "34123456",
      nombre: "Juan",
      apellido: null,
      numeroSocio: "SOC-1001",
    });
    expect(cookieJar.has(SOCIO_COOKIE)).toBe(true);

    await clearSocioSession();
    expect(cookieJar.has(SOCIO_COOKIE)).toBe(false);
    expect(await getSocioSession()).toBeNull();
  });

  it("revoca la sesión de un socio desactivado", async () => {
    await createSocioSession({
      id: "socio-1",
      dni: "34123456",
      nombre: "Juan",
      apellido: null,
      numeroSocio: "SOC-1001",
    });
    expect(await getSocioSession()).not.toBeNull();

    fakePrisma.__reset({
      socios: [
        {
          id: "socio-1",
          numeroSocio: "SOC-1001",
          dni: "34123456",
          nombre: "Juan",
          apellido: null,
          telefono: null,
          email: null,
          passwordHash: null,
          puntosActuales: 100,
          puntosHistoricos: 100,
          activo: false,
          fechaAlta: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    expect(await getSocioSession()).toBeNull();
  });

  it("revoca la sesión de un usuario de staff eliminado", async () => {
    await createStaffSession({
      id: "user-1",
      username: "ana",
      nombre: "Ana",
      role: "ADMIN",
    });
    expect(await getStaffSession()).not.toBeNull();

    fakePrisma.__reset({ usuarios: [] });

    expect(await getStaffSession()).toBeNull();
  });

  it("refresca el rol del staff desde la base (descenso inmediato)", async () => {
    const token = jwt.sign(
      {
        id: "user-1",
        username: "ana",
        nombre: "Ana",
        role: "ADMIN",
        type: "STAFF",
      },
      SECRET,
      { expiresIn: "12h" }
    );
    cookieJar.set(STAFF_COOKIE, token);

    fakePrisma.__reset({
      socios: [],
      usuarios: [
        {
          id: "user-1",
          username: "ana",
          nombre: "Ana",
          role: "MOZO",
          passwordHash: "hash",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const session = await getStaffSession();
    expect(session?.role).toBe("MOZO");
  });

  it("la sesión de socio vence a los 7 días (no 30)", async () => {
    const token = await createSocioSession({
      id: "socio-1",
      dni: "34123456",
      nombre: "Juan",
      apellido: null,
      numeroSocio: "SOC-1001",
    });

    const decoded = jwt.decode(token) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });
});
