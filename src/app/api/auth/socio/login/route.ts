import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSocioSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawDni = body?.dni;

    if (!rawDni || typeof rawDni !== "string") {
      return NextResponse.json(
        { success: false, error: "El número de DNI es obligatorio." },
        { status: 400 }
      );
    }

    // Normalizar DNI: remover puntos, espacios, guiones
    const cleanDni = rawDni.replace(/[.\-\s]/g, "").trim();

    if (cleanDni.length < 6) {
      return NextResponse.json(
        { success: false, error: "El DNI ingresado no es válido." },
        { status: 400 }
      );
    }

    // Buscar socio en Supabase
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
          error: "No encontramos ningún socio registrado con el DNI " + cleanDni + ". Puedes solicitar el alta con tu mozo.",
        },
        { status: 404 }
      );
    }

    if (!socio.activo) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta cuenta de socio se encuentra pausada. Por favor consulta con la administración.",
        },
        { status: 403 }
      );
    }

    // Crear sesión HTTP-Only
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
  } catch (error: any) {
    console.error("Error en socio login:", error);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta configurar DATABASE_URL en las Variables de Entorno de Vercel. Luego debes hacer Redeploy.",
        },
        { status: 500 }
      );
    }

    const rawMessage = error?.message || "";
    if (rawMessage.includes("PrismaClient") || rawMessage.includes("database") || rawMessage.includes("connect")) {
      return NextResponse.json(
        {
          success: false,
          error: "Error de conexión con la base de datos Supabase: " + rawMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Ocurrió un error al procesar el ingreso. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
