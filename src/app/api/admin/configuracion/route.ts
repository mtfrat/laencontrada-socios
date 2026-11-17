import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    let config = await prisma.configuracionPuntos.findFirst();

    if (!config) {
      config = await prisma.configuracionPuntos.create({
        data: {
          pesosPorPunto: 1000.0,
          puntosPorEncuesta: 10,
          puntosPorReferido: 5,
          minutosValidezQRCanje: 15,
          encuestaActiva: true,
          encuestaUnaVezPorSocio: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        pesosPorPunto: Number(config.pesosPorPunto),
        minutosValidezQRCanje: config.minutosValidezQRCanje,
        puntosPorEncuesta: config.puntosPorEncuesta,
        puntosPorReferido: config.puntosPorReferido,
        encuestaActiva: config.encuestaActiva,
        encuestaUnaVezPorSocio: config.encuestaUnaVezPorSocio,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar la configuración." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        pesosPorPunto: z.coerce
          .number({ error: "El monto en pesos por punto debe ser mayor a 0." })
          .positive("El monto en pesos por punto debe ser mayor a 0."),
        minutosValidezQRCanje: z.coerce
          .number({
            error: "Los minutos de validez del QR deben estar entre 1 y 180 minutos.",
          })
          .int("Los minutos de validez del QR deben estar entre 1 y 180 minutos.")
          .min(1, "Los minutos de validez del QR deben estar entre 1 y 180 minutos.")
          .max(180, "Los minutos de validez del QR deben estar entre 1 y 180 minutos."),
        puntosPorEncuesta: z.coerce.number().int().nullish(),
        puntosPorReferido: z.coerce.number().int().nullish(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const {
      pesosPorPunto: parsedPesos,
      minutosValidezQRCanje: parsedMinutos,
      puntosPorEncuesta: rawEncuesta,
      puntosPorReferido: rawReferido,
    } = campos.data;

    const parsedEncuesta = rawEncuesta ?? NaN;
    const parsedReferido = rawReferido ?? NaN;

    let config = await prisma.configuracionPuntos.findFirst();

    if (!config) {
      config = await prisma.configuracionPuntos.create({
        data: {
          pesosPorPunto: parsedPesos,
          minutosValidezQRCanje: parsedMinutos,
          puntosPorEncuesta: isNaN(parsedEncuesta) ? 10 : Math.max(0, parsedEncuesta),
          puntosPorReferido: isNaN(parsedReferido) ? 5 : Math.max(0, parsedReferido),
        },
      });
    } else {
      config = await prisma.configuracionPuntos.update({
        where: { id: config.id },
        data: {
          pesosPorPunto: parsedPesos,
          minutosValidezQRCanje: parsedMinutos,
          puntosPorEncuesta: isNaN(parsedEncuesta) ? config.puntosPorEncuesta : Math.max(0, parsedEncuesta),
          puntosPorReferido: isNaN(parsedReferido) ? config.puntosPorReferido : Math.max(0, parsedReferido),
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        pesosPorPunto: Number(config.pesosPorPunto),
        minutosValidezQRCanje: config.minutosValidezQRCanje,
        puntosPorEncuesta: config.puntosPorEncuesta,
        puntosPorReferido: config.puntosPorReferido,
        updatedAt: config.updatedAt,
      },
      message: "¡Reglas del restaurante actualizadas correctamente!",
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar las nuevas reglas." },
      { status: 500 }
    );
  }
}