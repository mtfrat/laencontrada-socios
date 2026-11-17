import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSocioSession } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { hitPersistentRateLimit } from "@/lib/persistent-rate-limit";
import { dniSchema, readJsonBody, validate } from "@/lib/validation";

const credentialsSchema = z.object({ dni: dniSchema, password: dniSchema });
const invalid = () => NextResponse.json({ success: false, code: "INVALID_CREDENTIALS", error: "DNI o contraseña incorrectos." }, { status: 401 });

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await hitPersistentRateLimit("socio-login-ip", ip, 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ success: false, code: "RATE_LIMITED", error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } });
    }
    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const credentials = validate(credentialsSchema, parsed.data);
    if (!credentials.ok) return credentials.response;
    const { dni, password } = credentials.data;
    if (dni !== password) return invalid();
    const dniLimit = await hitPersistentRateLimit("socio-login-dni", dni, 10, 15 * 60 * 1000);
    if (!dniLimit.allowed) {
      return NextResponse.json({ success: false, code: "RATE_LIMITED", error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." }, { status: 429, headers: { "Retry-After": String(dniLimit.retryAfterSeconds) } });
    }
    const socio = await prisma.socio.findUnique({ where: { dni }, select: { id: true, dni: true, nombre: true, apellido: true, numeroSocio: true, sessionVersion: true, activo: true } });
    if (!socio?.activo) return invalid();
    await createSocioSession({ id: socio.id, dni: socio.dni, nombre: socio.nombre, apellido: socio.apellido, numeroSocio: socio.numeroSocio, sessionVersion: socio.sessionVersion });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error en socio login:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, code: "INTERNAL_ERROR", error: "No pudimos iniciar tu sesión en este momento. Intentá nuevamente." }, { status: 500 });
  }
}
