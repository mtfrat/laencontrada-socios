import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { FranjaHoraria } from "@prisma/client";
import { readJsonBody, validate } from "@/lib/validation";

const visitaDetailInclude = {
  socio: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      numeroSocio: true,
    },
  },
  registradoPor: {
    select: {
      id: true,
      nombre: true,
      username: true,
    },
  },
  platos: true,
  ticketAdjunto: true,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const visita = await prisma.visitaConsumo.findUnique({
      where: { id },
      include: visitaDetailInclude,
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
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        franjaHoraria: z.string().optional(),
        fechaVisita: z.string().optional(),
        notas: z.string().nullish(),
        platos: z
          .array(
            z.object({
              nombrePlato: z.string().optional(),
              cantidad: z.unknown().optional(),
              notas: z.string().optional(),
            })
          )
          .optional(),
        numeroTicketFiscal: z.string().nullish(),
        urlArchivo: z.string().nullish(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const {
      franjaHoraria,
      fechaVisita,
      notas,
      platos,
      numeroTicketFiscal,
      urlArchivo,
    } = campos.data;

    const visitaExistente = await prisma.visitaConsumo.findUnique({ where: { id } });
    if (!visitaExistente) {
      return NextResponse.json({ success: false, error: "Visita no encontrada." }, { status: 404 });
    }

    // Ejecutar actualización en transacción
    const visitaActualizada = await prisma.$transaction(async (tx) => {
      // 1. Actualizar campos de la visita
      const updated = await tx.visitaConsumo.update({
        where: { id },
        data: {
          franjaHoraria: franjaHoraria && Object.values(FranjaHoraria).includes(franjaHoraria as FranjaHoraria)
            ? (franjaHoraria as FranjaHoraria)
            : undefined,
          fechaVisita: fechaVisita ? new Date(fechaVisita) : undefined,
          notas: notas !== undefined ? (notas ? notas.trim() : null) : undefined,
        },
      });

      // 2. Si se envían platos consumidos, reemplazarlos
      if (Array.isArray(platos)) {
        await tx.itemPlatoConsumido.deleteMany({
          where: { visitaConsumoId: id },
        });

        if (platos.length > 0) {
          await tx.itemPlatoConsumido.createMany({
            data: platos
              .filter((p) => p.nombrePlato && p.nombrePlato.trim().length > 0)
              .map((p) => ({
                visitaConsumoId: id,
                nombrePlato: (p.nombrePlato as string).trim(),
                cantidad: Math.max(1, Number(p.cantidad) || 1),
                notas: p.notas ? p.notas.trim() : null,
              })),
          });
        }
      }

      // 3. Si se envía información de ticket
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
      include: visitaDetailInclude,
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
