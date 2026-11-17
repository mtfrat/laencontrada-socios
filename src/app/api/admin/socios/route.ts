import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { TipoTransaccion } from "@prisma/client";
import { dniSchema, readJsonBody, validate } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query) {
      const cleanQuery = query.replace(/[.\-\s]/g, "");
      whereClause.OR = [
        { dni: { contains: cleanQuery, mode: "insensitive" } },
        { numeroSocio: { contains: query, mode: "insensitive" } },
        { nombre: { contains: query, mode: "insensitive" } },
        { apellido: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, socios] = await Promise.all([
      prisma.socio.count({ where: whereClause }),
      prisma.socio.findMany({
        where: whereClause,
        orderBy: [{ puntosActuales: "desc" }, { fechaAlta: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          numeroSocio: true,
          dni: true,
          nombre: true,
          apellido: true,
          telefono: true,
          email: true,
          puntosActuales: true,
          puntosHistoricos: true,
          activo: true,
          fechaAlta: true,
          _count: {
            select: {
              visitas: true,
              canjes: { where: { estado: "COMPLETADO" } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      socios: socios.map((s) => ({
        id: s.id,
        numeroSocio: s.numeroSocio,
        dni: s.dni,
        nombre: s.nombre,
        apellido: s.apellido,
        telefono: s.telefono,
        email: s.email,
        puntosActuales: s.puntosActuales,
        puntosHistoricos: s.puntosHistoricos,
        activo: s.activo,
        fechaAlta: s.fechaAlta,
        totalVisitas: s._count.visitas,
        totalCanjes: s._count.canjes,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener socios en admin:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar la nómina de socios." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;
    const body = (bodyParsed.data ?? {}) as Record<string, unknown>;
    const { action } = body;

    // ACCION: Crear nuevo socio desde Administración
    if (action === "crear_socio") {
      const campos = validate(
        z.object({
          dni: dniSchema,
          nombre: z
            .string({ error: "El nombre es obligatorio." })
            .trim()
            .min(1, "El nombre es obligatorio."),
          apellido: z.string().trim().optional(),
          telefono: z.string().trim().optional(),
          email: z.string().trim().optional(),
          puntosIniciales: z.unknown().optional(),
        }),
        body
      );
      if (!campos.ok) return campos.response;
      const {
        dni: cleanDni,
        nombre,
        apellido,
        telefono,
        email,
        puntosIniciales,
      } = campos.data;

      const existing = await prisma.socio.findUnique({ where: { dni: cleanDni } });
      if (existing) {
        return NextResponse.json({
          success: false,
          error: `Ya existe un socio con DNI ${cleanDni} (${existing.nombre} ${existing.apellido || ""}).`,
        }, { status: 400 });
      }

      // Calcular siguiente número de socio, reintentando ante colisiones
      // concurrentes (dni y numeroSocio son únicos en la base)
      let nuevoSocio = null;
      for (let intento = 0; intento < 3 && !nuevoSocio; intento++) {
        const allSocios = await prisma.socio.findMany({ select: { numeroSocio: true } });
        let maxNum = 1000;
        for (const s of allSocios) {
          const match = s.numeroSocio.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        let nextNum = maxNum + 1;
        let nextNumSocio = `SOC-${nextNum}`;
        while (allSocios.some((s) => s.numeroSocio === nextNumSocio)) {
          nextNum++;
          nextNumSocio = `SOC-${nextNum}`;
        }

        const initialPoints = Math.max(0, parseInt(String(puntosIniciales ?? ""), 10) || 0);

        try {
          nuevoSocio = await prisma.socio.create({
            data: {
              numeroSocio: nextNumSocio,
              dni: cleanDni,
              nombre: nombre.trim(),
              apellido: apellido || null,
              telefono: telefono || null,
              email: email ? email.toLowerCase() : null,
              puntosActuales: initialPoints,
              puntosHistoricos: initialPoints,
              activo: true,
            },
            select: {
              id: true,
              numeroSocio: true,
              dni: true,
              nombre: true,
              apellido: true,
              telefono: true,
              email: true,
              puntosActuales: true,
              puntosHistoricos: true,
              activo: true,
              fechaAlta: true,
            },
          });
        } catch (error) {
          if ((error as { code?: string })?.code !== "P2002") {
            throw error;
          }
          const porDni = await prisma.socio.findUnique({ where: { dni: cleanDni } });
          if (porDni) {
            return NextResponse.json({
              success: false,
              error: `Ya existe un socio con DNI ${cleanDni} (${porDni.nombre} ${porDni.apellido || ""}).`,
            }, { status: 400 });
          }
        }
      }

      if (!nuevoSocio) {
        return NextResponse.json(
          { success: false, error: "No se pudo asignar un número de socio. Intenta nuevamente." },
          { status: 500 }
        );
      }

      if (nuevoSocio.puntosActuales > 0) {
        await prisma.transaccionPuntos.create({
          data: {
            socioId: nuevoSocio.id,
            registradoPorId: session.id,
            tipo: TipoTransaccion.AJUSTE_MANUAL,
            puntos: nuevoSocio.puntosActuales,
            motivo: "Puntos de bienvenida o saldo inicial cargado por Administración",
          },
        });
      }

      return NextResponse.json({
        success: true,
        socio: nuevoSocio,
        message: `Socio ${nuevoSocio.nombre} registrado con éxito con el número ${nuevoSocio.numeroSocio}.`,
      });
    }

    const { socioId } = body;

    if (!socioId || typeof socioId !== "string") {
      return NextResponse.json(
        { success: false, error: "ID de socio obligatorio." },
        { status: 400 }
      );
    }

    const socio = await prisma.socio.findUnique({ where: { id: socioId } });
    if (!socio) {
      return NextResponse.json({ success: false, error: "Socio no encontrado" }, { status: 404 });
    }

    if (action === "actualizar_correo") {
      const correo = validate(z.string().trim().toLowerCase().email("Ingresá un correo válido.").max(254), body.email, { requiredCode: "EMAIL_REQUIRED", code: "EMAIL_INVALID" });
      if (!correo.ok) return correo.response;
      if (socio.email?.toLowerCase() === correo.data) {
        return NextResponse.json({ success: true, email: correo.data, message: "El correo ya estaba actualizado." });
      }
      await prisma.$transaction(async (tx) => {
        await tx.socio.update({ where: { id: socio.id }, data: { email: correo.data, sessionVersion: { increment: 1 } } });
        await tx.accesoSocioCodigo.updateMany({ where: { socioId: socio.id, usadoAt: null }, data: { usadoAt: new Date() } });
      });
      return NextResponse.json({ success: true, email: correo.data, message: "Correo actualizado. El socio deberá ingresar con un código nuevo." });
    }

    // ACCION 1: Ajuste Manual de Puntos
    if (action === "ajuste_puntos") {
      const { puntos, motivo } = body;
      const puntosInt = parseInt(String(puntos ?? ""), 10);

      if (isNaN(puntosInt) || puntosInt === 0) {
        return NextResponse.json(
          { success: false, error: "La cantidad de puntos a ajustar debe ser distinta de 0." },
          { status: 400 }
        );
      }

      if (!motivo || typeof motivo !== "string" || !motivo.trim()) {
        return NextResponse.json(
          { success: false, error: "Debes ingresar un motivo para la auditoría del ajuste." },
          { status: 400 }
        );
      }

      if (socio.puntosActuales + puntosInt < 0) {
        return NextResponse.json(
          {
            success: false,
            error: `El ajuste dejaría el saldo en negativo (${socio.puntosActuales} + ${puntosInt} < 0).`,
          },
          { status: 400 }
        );
      }

      const res = await prisma.$transaction(async (tx) => {
        const socioActualizado = await tx.socio.update({
          where: { id: socio.id },
          data: {
            puntosActuales: { increment: puntosInt },
            puntosHistoricos: puntosInt > 0 ? { increment: puntosInt } : undefined,
          },
        });

        await tx.transaccionPuntos.create({
          data: {
            socioId: socio.id,
            registradoPorId: session.id,
            tipo: TipoTransaccion.AJUSTE_MANUAL,
            puntos: puntosInt,
            motivo: `Ajuste manual administrativo: ${motivo.trim()}`,
          },
        });

        return socioActualizado;
      });

      return NextResponse.json({
        success: true,
        nuevoSaldo: res.puntosActuales,
        message: `Ajuste de ${puntosInt > 0 ? "+" : ""}${puntosInt} puntos registrado con éxito.`,
      });
    }

    // ACCION 2: Activar / Pausar cuenta
    if (action === "toggle_activo") {
      const socioActualizado = await prisma.socio.update({
        where: { id: socio.id },
        data: { activo: !socio.activo },
      });

      return NextResponse.json({
        success: true,
        activo: socioActualizado.activo,
        message: `Socio ${socioActualizado.activo ? "activado" : "pausado"} con éxito.`,
      });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error en acción de socio admin:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la operación sobre el socio." },
      { status: 500 }
    );
  }
}
