import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSocioSession } from "@/lib/guards";
import { EstadoCanje } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSocioSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await params;

    let canje = await prisma.canjePremio.findUnique({
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
    if (estadoActual === EstadoCanje.PENDIENTE && now >= canje.fechaExpiracion) {
      const expired = await prisma.canjePremio.updateMany({
        where: { id: canje.id, estado: EstadoCanje.PENDIENTE, fechaExpiracion: { lte: now } },
        data: { estado: EstadoCanje.EXPIRADO },
      });
      if (expired.count > 0) {
        estadoActual = EstadoCanje.EXPIRADO;
      } else {
        // A waiter may have validated the coupon after our first read.
        const current = await prisma.canjePremio.findUnique({
          where: { id },
          include: { premio: { select: { id: true, titulo: true, descripcion: true, puntosRequeridos: true, imagenUrl: true } }, validadoPor: { select: { nombre: true } } },
        });
        if (!current || current.socioId !== session.id) {
          return NextResponse.json({ success: false, error: "Cupón no encontrado." }, { status: 404 });
        }
        canje = current;
        estadoActual = current.estado;
      }
    }

    const segundosRestantes = estadoActual === EstadoCanje.PENDIENTE ? Math.max(
      0,
      Math.floor((new Date(canje.fechaExpiracion).getTime() - Date.now()) / 1000)
    ) : 0;

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
    const auth = await requireSocioSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

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
    const cancelled = await prisma.canjePremio.updateMany({
      where: { id, socioId: session.id, estado: EstadoCanje.PENDIENTE },
      data: { estado: EstadoCanje.CANCELADO },
    });

    if (cancelled.count === 0) {
      return NextResponse.json({ success: false, error: "El cupón cambió de estado. Actualizá la página para consultar el resultado." }, { status: 409 });
    }

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
