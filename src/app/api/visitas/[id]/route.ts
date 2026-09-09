import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { FranjaHoraria } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;

    const visita = await prisma.visitaConsumo.findUnique({
      where: { id },
      include: {
        socio: true,
        registradoPor: true,
        platos: true,
        ticketAdjunto: true,
      },
    });

    if (!visita) {
      return NextResponse.json({ success: false, error: "Visita no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, visita });
  } catch (error) {
    console.error("Error obteniendo detalle de visita:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la visita." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { franjaHoraria, fechaVisita, notas, platos, numeroTicketFiscal, urlArchivo } = body;

    const visitaExistente = await prisma.visitaConsumo.findUnique({ where: { id } });
    if (!visitaExistente) {
      return NextResponse.json({ success: false, error: "Visita no encontrada." }, { status: 404 });
    }

    // Ejecutar actualizaci�n en transacci�n
    const visitaActualizada = await prisma.$transaction(async (tx) => {
      // 1. Actualizar campos de la visita
      const updated = await tx.visitaConsumo.update({
        where: { id },
        data: {
          franjaHoraria: franjaHoraria && Object.values(FranjaHoraria).includes(franjaHoraria)
            ? (franjaHoraria as FranjaHoraria)
            : undefined,
          fechaVisita: fechaVisita ? new Date(fechaVisita) : undefined,
          notas: notas !== undefined ? (notas ? String(notas).trim() : null) : undefined,
        },
      });

      // 2. Si se env�an platos consumidos, reemplazarlos
      if (Array.isArray(platos)) {
        await tx.itemPlatoConsumido.deleteMany({
          where: { visitaConsumoId: id },
        });

        if (platos.length > 0) {
          await tx.itemPlatoConsumido.createMany({
            data: platos
              .filter((p: { nombrePlato?: string }) => p.nombrePlato && p.nombrePlato.trim().length > 0)
              .map((p: { nombrePlato: string; cantidad?: number; notas?: string }) => ({
                visitaConsumoId: id,
                nombrePlato: p.nombrePlato.trim(),
                cantidad: Math.max(1, Number(p.cantidad) || 1),
                notas: p.notas ? p.notas.trim() : null,
              })),
          });
        }
      }

      // 3. Si se env�a informaci�n de ticket
      if (numeroTicketFiscal !== undefined || urlArchivo !== undefined) {
        await tx.ticketAdjunto.upsert({
          where: { visitaConsumoId: id },
          create: {
            visitaConsumoId: id,
            numeroTicketFiscal: numeroTicketFiscal ? String(numeroTicketFiscal).trim() : null,
            urlArchivo: urlArchivo ? String(urlArchivo).trim() : null,
          },
          update: {
            numeroTicketFiscal: numeroTicketFiscal ? String(numeroTicketFiscal).trim() : null,
            urlArchivo: urlArchivo ? String(urlArchivo).trim() : null,
          },
        });
      }

      return updated;
    });

    // Devolver visita completa
    const visitaCompleta = await prisma.visitaConsumo.findUnique({
      where: { id: visitaActualizada.id },
      include: {
        socio: true,
        registradoPor: true,
        platos: true,
        ticketAdjunto: true,
      },
    });

    return NextResponse.json({ success: true, visita: visitaCompleta });
  } catch (error) {
    console.error("Error actualizando visita:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar los datos de la visita." },
      { status: 500 }
    );
  }
}
