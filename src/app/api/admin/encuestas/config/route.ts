import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const config = await prisma.configuracionPuntos.findFirst();
    return NextResponse.json({
      success: true,
      config: {
        puntosPorEncuesta: config?.puntosPorEncuesta || 10,
        encuestaActiva: config?.encuestaActiva ?? true,
        encuestaUnaVezPorSocio: config?.encuestaUnaVezPorSocio ?? false,
      },
    });
  } catch (error) {
    console.error("Error obteniendo config de encuestas:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la configuración." },
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
        puntosPorEncuesta: z.coerce.number().int().min(0).optional(),
        encuestaActiva: z.boolean().optional(),
        encuestaUnaVezPorSocio: z.boolean().optional(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { puntosPorEncuesta, encuestaActiva, encuestaUnaVezPorSocio } =
      campos.data;

    const dataToUpdate: Record<string, unknown> = {};

    if (puntosPorEncuesta !== undefined) {
      dataToUpdate.puntosPorEncuesta = puntosPorEncuesta;
    }

    if (encuestaActiva !== undefined) {
      dataToUpdate.encuestaActiva = encuestaActiva;
    }

    if (encuestaUnaVezPorSocio !== undefined) {
      dataToUpdate.encuestaUnaVezPorSocio = encuestaUnaVezPorSocio;
    }

    const config = await prisma.configuracionPuntos.findFirst();
    let updated;
    if (config) {
      updated = await prisma.configuracionPuntos.update({
        where: { id: config.id },
        data: dataToUpdate,
      });
    } else {
      updated = await prisma.configuracionPuntos.create({
        data: {
          puntosPorEncuesta: puntosPorEncuesta ?? 10,
          encuestaActiva: encuestaActiva ?? true,
          encuestaUnaVezPorSocio: encuestaUnaVezPorSocio ?? false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        puntosPorEncuesta: updated.puntosPorEncuesta,
        encuestaActiva: updated.encuestaActiva,
        encuestaUnaVezPorSocio: updated.encuestaUnaVezPorSocio,
      },
    });
  } catch (error) {
    console.error("Error actualizando configuración de encuestas:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la configuración." },
      { status: 500 }
    );
  }
}
