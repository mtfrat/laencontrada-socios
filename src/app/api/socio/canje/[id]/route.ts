import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSocioSession } from "@/lib/auth";
import { EstadoCanje } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const canje = await prisma.canjePremio.findUnique({
      where: { id },
      include: {
        premio: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            puntosRequeridos: true,
            imagenUrl: true,
          },
        },
        validadoPor: {
          select: {
            nombre: true,
          },
        },
      },
    });

    if (!canje || canje.socioId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Cupón no encontrado o no pertenece a tu cuenta." },
        { status: 404 }
      );
    }

    const now = new Date();
    let estadoActual = canje.estado;

    // Si está pendiente y ya expiró, actualizar en BD
    if (estadoActual === EstadoCanje.PENDIENTE && now > canje.fechaExpiracion) {
      await prisma.canjePremio.update({
        where: { id: canje.id },
        data: { estado: EstadoCanje.EXPIRADO },
      });
      estadoActual = EstadoCanje.EXPIRADO;
    }

    const segundosRestantes = Math.max(
      0,
      Math.floor((new Date(canje.fechaExpiracion).getTime() - Date.now()) / 1000)
    );

    return NextResponse.json({
      success: true,
      canje: {
        id: canje.id,
        codigoQR: canje.codigoQR,
        estado: estadoActual,
        puntosGastados: canje.puntosGastados,
        fechaExpiracion: canje.fechaExpiracion,
        segundosRestantes,
        fechaCanje: canje.fechaCanje,
        validadoPor: canje.validadoPor?.nombre || null,
        premio: canje.premio,
      },
    });
  } catch (error) {
    console.error("Error al obtener cupón de canje:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar el estado del cupón." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const canje = await prisma.canjePremio.findUnique({
      where: { id },
    });

    if (!canje || canje.socioId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Cupón no encontrado." },
        { status: 404 }
      );
    }

    if (canje.estado !== EstadoCanje.PENDIENTE) {
      return NextResponse.json(
        {
          success: false,
          error: `No puedes cancelar un cupón en estado ${canje.estado}.`,
        },
        { status: 400 }
      );
    }

    // Cancelar canje y liberar cupón
    await prisma.canjePremio.update({
      where: { id },
      data: { estado: EstadoCanje.CANCELADO },
    });

    return NextResponse.json({
      success: true,
      message: "Canje cancelado exitosamente. Tus puntos están disponibles.",
    });
  } catch (error) {
    console.error("Error al cancelar canje:", error);
    return NextResponse.json(
      { success: false, error: "Error al cancelar el canje." },
      { status: 500 }
    );
  }
}