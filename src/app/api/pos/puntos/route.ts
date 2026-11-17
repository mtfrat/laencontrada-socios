import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { calculateTablePoints } from "@/lib/points-engine";
import { readJsonBody, validate } from "@/lib/validation";
import { FranjaHoraria, OrigenAcreditacion, TipoTransaccion } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        numeroFactura: z.string({ error: "Ingresá el número de factura del ticket." })
          .trim()
          .regex(/^\d{4}-\d{8}$/, "Ingresá el número completo, por ejemplo 0001-00001362.")
          .refine((value) => !/^0{4}-0{8}$/.test(value), "Ingresá un número de factura válido."),
        montoTotalTicket: z.coerce
          .number({ error: "El monto del ticket debe ser mayor a $0." })
          .positive("El monto del ticket debe ser mayor a $0."),
        cantidadComensales: z.coerce
          .number({ error: "Debe haber al menos 1 comensal en la mesa." })
          .int("Debe haber al menos 1 comensal en la mesa.")
          .min(1, "Debe haber al menos 1 comensal en la mesa."),
        sociosIds: z
          .array(z.string().min(1), {
            error: "Debes seleccionar al menos 1 socio presente en la mesa.",
          })
          .min(1, "Debes seleccionar al menos 1 socio presente en la mesa."),
        franjaHoraria: z.string().optional(),
        notas: z.string().nullish(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const {
      numeroFactura,
      montoTotalTicket: monto,
      cantidadComensales: comensales,
      sociosIds,
      franjaHoraria: userFranja,
      notas,
    } = campos.data;

    if (sociosIds.length > comensales) {
      return NextResponse.json(
        { success: false, error: "La cantidad de socios no puede superar la cantidad de comensales." },
        { status: 400 }
      );
    }

    if (new Set(sociosIds).size !== sociosIds.length) {
      return NextResponse.json(
        { success: false, error: "Una mesa no puede incluir al mismo socio más de una vez." },
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

    if (puntosPorSocio < 1) {
      return NextResponse.json(
        { success: false, error: "El consumo por persona no alcanza para sumar un punto con la regla actual." },
        { status: 400 }
      );
    }

    // Determinar franja horaria automática si no fue provista
    let franja: FranjaHoraria = FranjaHoraria.CENA;
    if (userFranja && Object.values(FranjaHoraria).includes(userFranja as FranjaHoraria)) {
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

    if (socios.length !== sociosIds.length) {
      return NextResponse.json(
        { success: false, error: "Hay socios inexistentes o inactivos en la mesa. Volvé a seleccionarlos." },
        { status: 400 }
      );
    }

    const [comprobantePrevio, visitaPrevia] = await Promise.all([
      prisma.ticketAcreditado.findUnique({ where: { numeroFactura }, select: { id: true } }),
      prisma.ticketAdjunto.findFirst({ where: { numeroTicketFiscal: numeroFactura }, select: { id: true } }),
    ]);
    if (comprobantePrevio || visitaPrevia) {
      return NextResponse.json(
        { success: false, code: "TICKET_DUPLICADO", error: "Esta factura ya fue acreditada. Revisá el número antes de continuar." },
        { status: 409 }
      );
    }

    // Ejecutar transacción atómica en Supabase
    const resultado = await prisma.$transaction(async (tx) => {
      const sociosAcreditados = [];

      await tx.ticketAcreditado.create({
        data: {
          clave: `manual:${numeroFactura}`,
          origen: OrigenAcreditacion.MANUAL,
          numeroFactura,
          fechaTurno: new Date(),
          montoTotalTicket: monto,
          cantidadComensales: comensales,
          registradoPorId: session.id,
        },
      });

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
            ticketAdjunto: { create: { numeroTicketFiscal: numeroFactura } },
          },
        });

        sociosAcreditados.push(updatedSocio);
      }

      return sociosAcreditados;
    });

    return NextResponse.json({
      success: true,
      data: {
        numeroFactura,
        montoTotalTicket: monto,
        cantidadComensales: comensales,
        gastoPromedioPorPersona,
        puntosPorSocio,
        sociosAcreditados: resultado,
      },
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { success: false, code: "TICKET_DUPLICADO", error: "Esta factura ya fue acreditada. Revisá el número antes de continuar." },
        { status: 409 }
      );
    }
    console.error("Error acreditando puntos de mesa:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al acreditar los puntos de la mesa." },
      { status: 500 }
    );
  }
}
