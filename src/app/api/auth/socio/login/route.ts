import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSocioSession } from "@/lib/auth";
import {
  getClientIp,
  socioLoginDniLimiter,
  socioLoginIpLimiter,
} from "@/lib/rate-limit";

const RATE_LIMIT_ERROR =
  "Demasiados intentos de ingreso. Esperá unos minutos y volvé a intentar.";
const INTERNAL_ERROR =
  "No pudimos iniciar tu sesión en este momento. Intenta nuevamente.";

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, code: "RATE_LIMITED", error: RATE_LIMIT_ERROR },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request: Request) {
  const ipDecision = socioLoginIpLimiter.hit(`ip:${getClientIp(request)}`);
  if (!ipDecision.allowed) {
    return rateLimitedResponse(ipDecision.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const rawDni = body?.dni;

    if (!rawDni || typeof rawDni !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "DNI_REQUIRED",
          error: "El número de DNI es obligatorio.",
        },
        { status: 400 }
      );
    }

    const cleanDni = rawDni.replace(/[.\-\s]/g, "").trim();

    if (!/^\d{6,20}$/.test(cleanDni)) {
      return NextResponse.json(
        {
          success: false,
          code: "DNI_INVALID",
          error: "El DNI ingresado no es válido.",
        },
        { status: 400 }
      );
    }

    const dniDecision = socioLoginDniLimiter.hit(`dni:${cleanDni}`);
    if (!dniDecision.allowed) {
      return rateLimitedResponse(dniDecision.retryAfterSeconds);
    }

    const socio = await prisma.socio.findUnique({
      where: { dni: cleanDni },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        numeroSocio: true,
        puntosActuales: true,
        puntosHistoricos: true,
        activo: true,
      },
    });

    if (!socio) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_FOUND",
          error:
            "No encontramos ningún socio registrado con el DNI " +
            cleanDni +
            ". Puedes solicitar el alta con tu mozo.",
        },
        { status: 404 }
      );
    }

    if (!socio.activo) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_DISABLED",
          error:
            "Esta cuenta de socio se encuentra pausada. Por favor consulta con la administración.",
        },
        { status: 403 }
      );
    }

    await createSocioSession({
      id: socio.id,
      dni: socio.dni,
      nombre: socio.nombre,
      apellido: socio.apellido,
      numeroSocio: socio.numeroSocio,
    });

    return NextResponse.json({
      success: true,
      socio: {
        id: socio.id,
        dni: socio.dni,
        nombre: socio.nombre,
        apellido: socio.apellido,
        numeroSocio: socio.numeroSocio,
        puntosActuales: socio.puntosActuales,
        puntosHistoricos: socio.puntosHistoricos,
      },
    });
  } catch (error) {
    console.error("Error en socio login:", {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", error: INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
