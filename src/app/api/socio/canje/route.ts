import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSocioSession } from "@/lib/guards";
import { ApiError, errorResponse } from "@/lib/api-error";
import { CanjePremio, EstadoCanje } from "@prisma/client";

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CANJE-";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function generateUniqueCouponCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCouponCode();
    const exists = await prisma.canjePremio.findUnique({
      where: { codigoQR: candidate },
    });
    if (!exists) return candidate;
  }
  throw new ApiError(
    500,
    "CODIGO_NO_DISPONIBLE",
    "No se pudieron generar códigos de cupón únicos. Intenta nuevamente."
  );
}

export async function POST(request: Request) {
  try {
    const auth = await requireSocioSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { premioId } = body;

    if (!premioId || typeof premioId !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "PREMIO_REQUERIDO",
          error: "El ID del premio es requerido.",
        },
        { status: 400 }
      );
    }

    const socio = await prisma.socio.findUnique({
      where: { id: session.id },
      select: { id: true, puntosActuales: true, activo: true },
    });

    if (!socio || !socio.activo) {
      return NextResponse.json(
        {
          success: false,
          code: "CUENTA_INACTIVA",
          error: "Socio no encontrado o inactivo.",
        },
        { status: 403 }
      );
    }

    const now = new Date();

    await prisma.canjePremio.updateMany({
      where: {
        socioId: socio.id,
        estado: EstadoCanje.PENDIENTE,
        fechaExpiracion: { lt: now },
      },
      data: { estado: EstadoCanje.EXPIRADO },
    });

    const premio = await prisma.premio.findUnique({ where: { id: premioId } });

    if (!premio || !premio.activo) {
      return NextResponse.json(
        {
          success: false,
          code: "PREMIO_NO_DISPONIBLE",
          error: "El premio seleccionado no está disponible.",
        },
        { status: 404 }
      );
    }

    const config = await prisma.configuracionPuntos.findFirst();
    const minutos = config?.minutosValidezQRCanje || 15;
    const fechaExpiracion = new Date(Date.now() + minutos * 60 * 1000);

    let canje: CanjePremio | null = null;

    for (let intento = 0; intento < 3 && !canje; intento++) {
      const codigoQR = await generateUniqueCouponCode();

      try {
        canje = await prisma.$transaction(async (tx) => {
          const socioOk = await tx.socio.updateMany({
            where: {
              id: socio.id,
              activo: true,
              puntosActuales: { gte: premio.puntosRequeridos },
            },
            data: { updatedAt: new Date() },
          });

          if (socioOk.count === 0) {
            const actual = await tx.socio.findUnique({
              where: { id: socio.id },
            });
            if (!actual || !actual.activo) {
              throw new ApiError(
                403,
                "CUENTA_INACTIVA",
                "Socio no encontrado o inactivo."
              );
            }
            throw new ApiError(
              400,
              "SALDO_INSUFICIENTE",
              `Puntos insuficientes. Tienes ${actual.puntosActuales} pts y necesitas ${premio.puntosRequeridos} pts.`
            );
          }

          const pendiente = await tx.canjePremio.findFirst({
            where: {
              socioId: socio.id,
              estado: EstadoCanje.PENDIENTE,
              fechaExpiracion: { gt: now },
            },
            include: { premio: true },
          });

          if (pendiente) {
            throw new ApiError(
              400,
              "CANJE_PENDIENTE",
              `Ya tienes un cupón pendiente para "${pendiente.premio.titulo}". Debes validarlo con el mozo o cancelarlo antes de solicitar otro.`,
              { canjePendienteId: pendiente.id }
            );
          }

          if (premio.stock !== -1) {
            const stockOk = await tx.premio.updateMany({
              where: {
                id: premio.id,
                activo: true,
                stock: { gt: 0 },
              },
              data: { updatedAt: new Date() },
            });

            if (stockOk.count === 0) {
              const actualPremio = await tx.premio.findUnique({
                where: { id: premio.id },
              });
              if (!actualPremio || !actualPremio.activo) {
                throw new ApiError(
                  404,
                  "PREMIO_NO_DISPONIBLE",
                  "El premio seleccionado no está disponible."
                );
              }
              throw new ApiError(
                400,
                "SIN_STOCK",
                "Lo sentimos, este premio se encuentra momentáneamente sin stock."
              );
            }
          }

          return tx.canjePremio.create({
            data: {
              socioId: socio.id,
              premioId: premio.id,
              codigoQR,
              estado: EstadoCanje.PENDIENTE,
              puntosGastados: premio.puntosRequeridos,
              fechaExpiracion,
            },
          });
        });
      } catch (error) {
        if ((error as { code?: string })?.code === "P2002") {
          continue;
        }
        throw error;
      }
    }

    if (!canje) {
      return NextResponse.json(
        {
          success: false,
          code: "CODIGO_NO_DISPONIBLE",
          error:
            "No se pudieron generar códigos de cupón únicos. Intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      canjeId: canje.id,
      codigoQR: canje.codigoQR,
      fechaExpiracion: canje.fechaExpiracion,
      message:
        "Cupón generado exitosamente. Tienes 15 minutos para presentarlo a tu mozo.",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    console.error("Error al generar cupón de canje:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Error al generar el cupón de canje.",
      },
      { status: 500 }
    );
  }
}
