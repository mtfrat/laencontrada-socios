import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";

const JWT_SECRET = process.env.SESSION_SECRET || "laencontrada-fallback-secret";
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
    expiresIn: "30d",
  });

  const cookieStore = await cookies();
  cookieStore.set(SOCIO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  });

  return token;
}

export async function getSocioSession(): Promise<SocioSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SOCIO_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SocioSessionPayload;
    if (decoded.type !== "SOCIO") return null;
    return decoded;
  } catch {
    return null;
  }
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as StaffSessionPayload;
    if (decoded.type !== "STAFF") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE);
}
