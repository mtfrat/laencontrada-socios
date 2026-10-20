import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function resolveJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error(
      "SESSION_SECRET no está configurado: la aplicación no puede iniciar sin un secreto de sesión seguro."
    );
  }
  if (secret.trim().length < 32) {
    throw new Error(
      "SESSION_SECRET debe tener al menos 32 caracteres para firmar sesiones de forma segura."
    );
  }
  return secret;
}

const JWT_SECRET = resolveJwtSecret();
const SOCIO_COOKIE = "laencontrada_socio_token";
const STAFF_COOKIE = "laencontrada_staff_token";

export interface SocioSessionPayload {
  id: string;
  dni: string;
  nombre: string;
  apellido?: string | null;
  numeroSocio: string;
  type: "SOCIO";
}

export interface StaffSessionPayload {
  id: string;
  username: string;
  nombre: string;
  role: RolUsuario;
  type: "STAFF";
}

// ==========================
// SESIONES DE SOCIOS
// ==========================
export async function createSocioSession(payload: Omit<SocioSessionPayload, "type">) {
  const token = jwt.sign({ ...payload, type: "SOCIO" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const cookieStore = await cookies();
  cookieStore.set(SOCIO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  });

  return token;
}

export async function getSocioSession(): Promise<SocioSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SOCIO_COOKIE)?.value;
  if (!token) return null;

  let decoded: SocioSessionPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as SocioSessionPayload;
    if (decoded.type !== "SOCIO") return null;
  } catch {
    return null;
  }

  // Revocación: la sesión solo vale mientras el socio exista y esté activo.
  // También refresca los datos del payload desde la base.
  const socio = await prisma.socio.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      dni: true,
      nombre: true,
      apellido: true,
      numeroSocio: true,
      activo: true,
    },
  });
  if (!socio || !socio.activo) return null;

  return {
    id: socio.id,
    dni: socio.dni,
    nombre: socio.nombre,
    apellido: socio.apellido,
    numeroSocio: socio.numeroSocio,
    type: "SOCIO",
  };
}

export async function clearSocioSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SOCIO_COOKIE);
}

// ==========================
// SESIONES DE PERSONAL (STAFF)
// ==========================
export async function createStaffSession(payload: Omit<StaffSessionPayload, "type">) {
  const token = jwt.sign({ ...payload, type: "STAFF" }, JWT_SECRET, {
    expiresIn: "12h",
  });

  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60, // 12 horas por turno
  });

  return token;
}

export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE)?.value;
  if (!token) return null;

  let decoded: StaffSessionPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as StaffSessionPayload;
    if (decoded.type !== "STAFF") return null;
  } catch {
    return null;
  }

  // Revocación: la sesión solo vale mientras el usuario exista.
  // El rol se refresca desde la base en cada lectura (un descenso de
  // rol surte efecto inmediato, sin esperar a que venza el token).
  const usuario = await prisma.usuario.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      username: true,
      nombre: true,
      role: true,
    },
  });
  if (!usuario) return null;

  return {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    role: usuario.role as RolUsuario,
    type: "STAFF",
  };
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE);
}
