import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSocioSession } from "@/lib/auth";
import { EstadoCanje } from "@prisma/client";

function generateCouponCode(): string {
  // Caracteres legibles evitando confusiones (sin O, 0, I, 1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CANJE-";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { premioId } = body;

    if (!premioId || typeof premioId !== "string") {
      return NextResponse.json(
        { success: false, error: "El ID del premio es requerido." },
        { status: 400 }
      );
    }

    const socio = await prisma.socio.findUnique({
      where: { id: session.id },
      select: { id: true, puntosActuales: true, activo: true },
    });

    if (!socio || !socio.activo) {
      return NextResponse.json(
        { success: false, error: "Socio no encontrado o inactivo." },
        { status: 403 }
      );
    }

    const now = new Date();

    // 1. Limpiar canjes expirados
    await prisma.canjePremio.updateMany({
      where: {
        socioId: socio.id,
        estado: EstadoCanje.PENDIENTE,
        fechaExpiracion: { lt: now },
      },
      data: { estado: EstadoCanje.EXPIRADO },
    });

    // 2. Verificar si ya tiene un canje activo pendiente
    const canjeExistente = await prisma.canjePremio.findFirst({
      where: {
        socioId: socio.id,
        estado: EstadoCanje.PENDIENTE,
        fechaExpiracion: { gt: now },
      },
      include: {
        premio: { select: { titulo: true } },
      },
    });

    if (canjeExistente) {
      return NextResponse.json({
        success: false,
        error: `Ya tienes un cupón pendiente para "${canjeExistente.premio.titulo}". Debes validarlo con el mozo o cancelarlo antes de solicitar otro.`,
        canjePendienteId: canjeExistente.id,
      }, { status: 400 });
    }

    // 3. Buscar el premio
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || !premio.activo) {
      return NextResponse.json(
        { success: false, error: "El premio seleccionado no está disponible." },
        { status: 404 }
      );
    }

    if (premio.stock === 0) {
      return NextResponse.json(
        { success: false, error: "Lo sentimos, este premio se encuentra momentáneamente sin stock." },
        { status: 400 }
      );
    }

    // 4. Verificar saldo
    if (socio.puntosActuales < premio.puntosRequeridos) {
      return NextResponse.json(
        {
          success: false,
          error: `Puntos insuficientes. Tienes ${socio.puntosActuales} pts y necesitas ${premio.puntosRequeridos} pts.`,
        },
        { status: 400 }
      );
    }

    // 5. Minutos de vigencia
    const config = await prisma.configuracionPuntos.findFirst();
    const minutos = config?.minutosValidezQRCanje || 15;
    const fechaExpiracion = new Date(Date.now() + minutos * 60 * 1000);

    // 6. Generar código QR único
    let codigoQR = generateCouponCode();
    let colision = await prisma.canjePremio.findUnique({ where: { codigoQR } });
    while (colision) {
      codigoQR = generateCouponCode();
      colision = await prisma.canjePremio.findUnique({ where: { codigoQR } });
    }

    // 7. Crear el registro de canje PENDIENTE
    const canje = await prisma.canjePremio.create({
      data: {
        socioId: socio.id,
        premioId: premio.id,
        codigoQR,
        estado: EstadoCanje.PENDIENTE,
        puntosGastados: premio.puntosRequeridos,
        fechaExpiracion,
      },
    });

    return NextResponse.json({
      success: true,
      canjeId: canje.id,
      codigoQR: canje.codigoQR,
      fechaExpiracion: canje.fechaExpiracion,
      message: "Cupón generado exitosamente. Tienes 15 minutos para presentarlo a tu mozo.",
    });
  } catch (error) {
    console.error("Error al generar cupón de canje:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar el cupón de canje." },
      { status: 500 }
    );
  }
}