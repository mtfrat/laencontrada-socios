import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

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
    const session = await getStaffSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pesosPorPunto, minutosValidezQRCanje, puntosPorEncuesta, puntosPorReferido } = body;

    const parsedPesos = parseFloat(pesosPorPunto);
    if (isNaN(parsedPesos) || parsedPesos <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto en pesos por punto debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const parsedMinutos = parseInt(minutosValidezQRCanje, 10);
    if (isNaN(parsedMinutos) || parsedMinutos < 1 || parsedMinutos > 180) {
      return NextResponse.json(
        { success: false, error: "Los minutos de validez del QR deben estar entre 1 y 180 minutos." },
        { status: 400 }
      );
    }

    const parsedEncuesta = parseInt(puntosPorEncuesta, 10);
    const parsedReferido = parseInt(puntosPorReferido, 10);

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