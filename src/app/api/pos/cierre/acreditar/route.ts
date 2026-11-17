import { NextResponse } from "next/server";
import { z } from "zod";
import { FranjaHoraria, OrigenAcreditacion, TipoTransaccion } from "@prisma/client";
import { requireStaffSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { calculateTablePoints } from "@/lib/points-engine";
import { parseUploadedCierre } from "@/lib/cierre-upload";
import { normalizeSocioNumber } from "@/lib/socio-number";

export const runtime = "nodejs";

const assignmentSchema = z.object({
  pesosPorPunto: z.number().positive(),
  asignaciones: z.array(z.object({
    numeroFactura: z.string().regex(/^\d{4}-\d{8}$/),
    comensales: z.number().int().min(1).max(30),
    numerosSocio: z.array(z.string().trim().min(1)).min(1).max(30),
  })).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const { form, cierre } = await parseUploadedCierre(request);
    let rawAssignments: unknown;
    try {
      rawAssignments = JSON.parse(String(form.get("asignaciones") ?? ""));
    } catch {
      return NextResponse.json({ success: false, error: "Revisá las mesas y los socios antes de acreditar." }, { status: 400 });
    }
    const parsed = assignmentSchema.safeParse(rawAssignments);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Hay mesas, comensales o números de socio incompletos." }, { status: 400 });
    }
    const { asignaciones, pesosPorPunto: ratioPrevisualizado } = parsed.data;
    const invoiceSet = new Set<string>();
    const memberSet = new Set<string>();
    const ticketByNumber = new Map(cierre.tickets.map((ticket) => [ticket.numeroFactura, ticket]));
    for (const assignment of asignaciones) {
      if (invoiceSet.has(assignment.numeroFactura) || !ticketByNumber.has(assignment.numeroFactura)) {
        return NextResponse.json({ success: false, error: "Hay una factura repetida o que no pertenece a este PDF." }, { status: 400 });
      }
      invoiceSet.add(assignment.numeroFactura);
      assignment.numerosSocio = assignment.numerosSocio.map(normalizeSocioNumber);
      if (assignment.numerosSocio.length > assignment.comensales ||
          new Set(assignment.numerosSocio).size !== assignment.numerosSocio.length) {
        return NextResponse.json({ success: false, error: `Revisá la cantidad de comensales y socios de la factura ${assignment.numeroFactura}.` }, { status: 400 });
      }
      if (assignment.numerosSocio.some((numero) => memberSet.has(numero))) {
        return NextResponse.json({ success: false, error: "Un socio aparece en más de una factura del cierre. Revisá las mesas antes de acreditar." }, { status: 400 });
      }
      assignment.numerosSocio.forEach((numero) => memberSet.add(numero));
    }
    const config = await prisma.configuracionPuntos.findFirst({ select: { pesosPorPunto: true } });
    const pesosPorPunto = Number(config?.pesosPorPunto ?? 1000);
    if (pesosPorPunto !== ratioPrevisualizado) {
      return NextResponse.json({ success: false, error: "La equivalencia de puntos cambió. Volvé a cargar el PDF para revisar el cálculo." }, { status: 409 });
    }
    const numeros = [...new Set(asignaciones.flatMap((row) => row.numerosSocio))];
    const socios = await prisma.socio.findMany({
      where: { numeroSocio: { in: numeros }, activo: true },
      select: { id: true, numeroSocio: true, nombre: true, apellido: true },
    });
    const socioByNumber = new Map(socios.map((socio) => [socio.numeroSocio.toUpperCase(), socio]));
    const missing = numeros.filter((numero) => !socioByNumber.has(numero));
    if (missing.length) {
      return NextResponse.json({ success: false, error: `No se encontraron socios activos con estos números: ${missing.join(", ")}.` }, { status: 400 });
    }
    const preparados = asignaciones.map((assignment) => {
      const ticket = ticketByNumber.get(assignment.numeroFactura)!;
      const calc = calculateTablePoints({
        totalTicket: ticket.monto,
        guestCount: assignment.comensales,
        pesosPorPunto,
      });
      if (calc.puntosPorSocio < 1) {
        throw new Error(`La factura ${ticket.numeroFactura} no alcanza para sumar un punto por persona.`);
      }
      return { assignment, ticket, calc };
    });
    const yaVinculadas = await prisma.ticketAdjunto.findMany({
      where: { numeroTicketFiscal: { in: preparados.map(({ ticket }) => ticket.numeroFactura) } },
      select: { numeroTicketFiscal: true },
    });
    if (yaVinculadas.length > 0) {
      return NextResponse.json({ success: false, error: "Una de las facturas ya está asociada a una visita. Volvé a cargar el PDF para revisar." }, { status: 409 });
    }
    const yaAcreditadas = await prisma.ticketAcreditado.findMany({
      where: { numeroFactura: { in: preparados.map(({ ticket }) => ticket.numeroFactura) } },
      select: { numeroFactura: true },
    });
    if (yaAcreditadas.length > 0) {
      return NextResponse.json({ success: false, error: "Una de las facturas ya fue acreditada por mesa o por PDF." }, { status: 409 });
    }
    const fechaTurno = new Date(`${cierre.fecha}T12:00:00-03:00`);
    const franja = /noche|cena/i.test(cierre.turnoNombre)
      ? FranjaHoraria.CENA
      : /almuerzo|d[ií]a|mediod[ií]a/i.test(cierre.turnoNombre)
        ? FranjaHoraria.ALMUERZO : FranjaHoraria.OTRO;

    const resumen = await prisma.$transaction(async (tx) => {
      let sociosAcreditados = 0;
      for (const { assignment, ticket, calc } of preparados) {
        await tx.ticketAcreditado.create({
          data: {
            clave: ticket.clave, origen: OrigenAcreditacion.CIERRE_PDF,
            cuit: cierre.cuit, sucursal: cierre.sucursal,
            numeroFactura: ticket.numeroFactura, mesa: ticket.mesa,
            cierreNumero: cierre.cierreNumero, turnoNumero: cierre.turnoNumero,
            fechaTurno, montoTotalTicket: ticket.monto,
            cantidadComensales: assignment.comensales,
            registradoPorId: auth.session.id,
          },
        });
        for (const numero of assignment.numerosSocio) {
          const socio = socioByNumber.get(numero)!;
          const updated = await tx.socio.updateMany({
            where: { id: socio.id, activo: true },
            data: {
              puntosActuales: { increment: calc.puntosPorSocio },
              puntosHistoricos: { increment: calc.puntosPorSocio },
            },
          });
          if (updated.count !== 1) throw new Error(`El socio ${numero} dejó de estar activo. No se acreditó el cierre.`);
          await tx.transaccionPuntos.create({
            data: {
              socioId: socio.id, registradoPorId: auth.session.id,
              tipo: TipoTransaccion.CONSUMO, puntos: calc.puntosPorSocio,
              motivo: `Factura ${ticket.numeroFactura} · Mesa ${ticket.mesa} · Cierre ${cierre.cierreNumero}`,
            },
          });
          await tx.visitaConsumo.create({
            data: {
              socioId: socio.id, registradoPorId: auth.session.id,
              fechaVisita: fechaTurno, franjaHoraria: franja,
              montoTotalTicket: ticket.monto,
              cantidadComensales: assignment.comensales,
              gastoPromedioPorPersona: calc.gastoPromedioPorPersona,
              puntosAcreditados: calc.puntosPorSocio,
              notas: `Cierre ${cierre.cierreNumero} · Mesa ${ticket.mesa}`,
              ticketAdjunto: { create: { numeroTicketFiscal: ticket.numeroFactura } },
            },
          });
          sociosAcreditados++;
        }
      }
      return { mesasAcreditadas: preparados.length, sociosAcreditados };
    });
    return NextResponse.json({ success: true, ...resumen });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ success: false, error: "Una de las facturas ya fue acreditada. Volvé a cargar el PDF para ver cuáles quedan pendientes." }, { status: 409 });
    }
    if (error instanceof Error && /PDF|cierre|factura|importe|ventas|punto|socio|50 páginas|100 facturas/i.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Error acreditando cierre de turno:", error);
    return NextResponse.json({ success: false, error: "No se pudo acreditar el cierre. No se aplicaron puntos." }, { status: 500 });
  }
}
