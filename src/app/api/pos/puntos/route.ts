import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { calculateTablePoints } from "@/lib/points-engine";
import { FranjaHoraria, TipoTransaccion } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      montoTotalTicket,
      cantidadComensales,
      sociosIds,
      franjaHoraria: userFranja,
      notas,
    } = body;

    const monto = Number(montoTotalTicket);
    const comensales = Number(cantidadComensales);

    if (!monto || monto <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto del ticket debe ser mayor a $0." },
        { status: 400 }
      );
    }

    if (!comensales || comensales < 1) {
      return NextResponse.json(
        { success: false, error: "Debe haber al menos 1 comensal en la mesa." },
        { status: 400 }
      );
    }

    if (!Array.isArray(sociosIds) || sociosIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debes seleccionar al menos 1 socio presente en la mesa." },
        { status: 400 }
      );
    }

    if (sociosIds.length > comensales) {
      return NextResponse.json(
        { success: false, error: "La cantidad de socios no puede superar la cantidad de comensales." },
        { status: 400 }
      );
    }

    // Obtener la regla configurada de pesos por punto
    const config = await prisma.configuracionPuntos.findFirst();
    const pesosPorPunto = Number(config?.pesosPorPunto || 1000);

    // Calcular puntos con el motor matemático
    const { gastoPromedioPorPersona, puntosPorSocio } = calculateTablePoints({
      totalTicket: monto,
      guestCount: comensales,
      pesosPorPunto,
    });

    // Determinar franja horaria automática si no fue provista
    let franja: FranjaHoraria = FranjaHoraria.CENA;
    if (userFranja && Object.values(FranjaHoraria).includes(userFranja)) {
      franja = userFranja as FranjaHoraria;
    } else {
      const currentHour = new Date().getHours();
      if (currentHour >= 11 && currentHour <= 16) {
        franja = FranjaHoraria.ALMUERZO;
      } else if (currentHour > 16 && currentHour <= 19) {
        franja = FranjaHoraria.TARDE;
      } else {
        franja = FranjaHoraria.CENA;
      }
    }

    // Verificar que los socios existan y estén activos
    const socios = await prisma.socio.findMany({
      where: {
        id: { in: sociosIds },
        activo: true,
      },
    });

    if (socios.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontraron socios válidos para acreditar puntos." },
        { status: 404 }
      );
    }

    // Ejecutar transacción atómica en Supabase
    const resultado = await prisma.$transaction(async (tx) => {
      const sociosAcreditados = [];

      for (const socio of socios) {
        // 1. Actualizar saldos del socio
        const updatedSocio = await tx.socio.update({
          where: { id: socio.id },
          data: {
            puntosActuales: { increment: puntosPorSocio },
            puntosHistoricos: { increment: puntosPorSocio },
          },
          select: {
            id: true,
            dni: true,
            nombre: true,
            apellido: true,
            puntosActuales: true,
          },
        });

        // 2. Registrar en el libro mayor de auditoría
        await tx.transaccionPuntos.create({
          data: {
            socioId: socio.id,
            registradoPorId: session.id,
            tipo: TipoTransaccion.CONSUMO,
            puntos: puntosPorSocio,
            motivo: `Mesa $${monto.toLocaleString("es-AR")} (${comensales} personas - prom. $${gastoPromedioPorPersona.toLocaleString("es-AR")})`,
          },
        });

        // 3. Crear registro de VisitaConsumo (preparado para enriquecimiento en Sprint 3)
        await tx.visitaConsumo.create({
          data: {
            socioId: socio.id,
            registradoPorId: session.id,
            fechaVisita: new Date(),
            franjaHoraria: franja,
            montoTotalTicket: monto,
            cantidadComensales: comensales,
            gastoPromedioPorPersona,
            puntosAcreditados: puntosPorSocio,
            notas: notas ? String(notas).trim() : null,
          },
        });

        sociosAcreditados.push(updatedSocio);
      }

      return sociosAcreditados;
    });

    return NextResponse.json({
      success: true,
      data: {
        montoTotalTicket: monto,
        cantidadComensales: comensales,
        gastoPromedioPorPersona,
        puntosPorSocio,
        sociosAcreditados: resultado,
      },
    });
  } catch (error) {
    console.error("Error acreditando puntos de mesa:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al acreditar los puntos de la mesa." },
      { status: 500 }
    );
  }
}
