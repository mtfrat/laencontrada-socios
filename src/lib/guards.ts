import { NextResponse } from "next/server";
import { RolUsuario } from "@prisma/client";
import { getStaffSession, getSocioSession } from "./auth";

export type StaffGuardResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getStaffSession>>> }
  | { ok: false; response: NextResponse };

export type SocioGuardResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSocioSession>>> }
  | { ok: false; response: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, code: "UNAUTHORIZED", error: "No autorizado." },
    { status: 401 }
  );
}

function forbidden(role: RolUsuario, requiredRole: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: "FORBIDDEN",
      error: `Se requiere acceso de ${requiredRole}. Tu acceso actual es ${role === "SUPER_ADMIN" ? "Administrador" : "Equipo"}.`,
    },
    { status: 403 }
  );
}

export async function requireStaffSession(): Promise<StaffGuardResult> {
  const session = await getStaffSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, session };
}

export async function requireAdminSession(): Promise<StaffGuardResult> {
  const result = await requireStaffSession();
  if (!result.ok) {
    return result;
  }
  if (result.session.role !== "SUPER_ADMIN") {
    return { ok: false, response: forbidden(result.session.role, "Administrador") };
  }
  return result;
}

export async function requireSuperAdminSession(): Promise<StaffGuardResult> {
  const result = await requireStaffSession();
  if (!result.ok) return result;
  if (result.session.role !== "SUPER_ADMIN") {
    return { ok: false, response: forbidden(result.session.role, "Administrador") };
  }
  return result;
}

export async function requireSocioSession(): Promise<SocioGuardResult> {
  const session = await getSocioSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, session };
}
