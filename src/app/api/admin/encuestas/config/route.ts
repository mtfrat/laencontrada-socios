import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

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
      { success: false, error: "Error al consultar la configuraci�n." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getStaffSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { puntosPorEncuesta, encuestaActiva, encuestaUnaVezPorSocio } = body;

    const dataToUpdate: Record<string, unknown> = {};

    if (puntosPorEncuesta !== undefined) {
      dataToUpdate.puntosPorEncuesta = Math.max(0, Number(puntosPorEncuesta) || 0);
    }

    if (encuestaActiva !== undefined) {
      dataToUpdate.encuestaActiva = Boolean(encuestaActiva);
    }

    if (encuestaUnaVezPorSocio !== undefined) {
      dataToUpdate.encuestaUnaVezPorSocio = Boolean(encuestaUnaVezPorSocio);
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
          puntosPorEncuesta: Number(puntosPorEncuesta) || 10,
          encuestaActiva: encuestaActiva !== undefined ? Boolean(encuestaActiva) : true,
          encuestaUnaVezPorSocio: encuestaUnaVezPorSocio !== undefined ? Boolean(encuestaUnaVezPorSocio) : false,
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
    console.error("Error actualizando configuraci�n de encuestas:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la configuraci�n." },
      { status: 500 }
    );
  }
}
