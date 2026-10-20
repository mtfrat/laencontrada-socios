import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { ApiError, errorResponse } from "@/lib/api-error";
import { EstadoCanje, TipoTransaccion } from "@prisma/client";

const includeCanje = {
  socio: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      puntosActuales: true,
    },
  },
  premio: {
    select: {
      id: true,
      titulo: true,
      stock: true,
    },
  },
};

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json(
        {
          success: false,
          code: "CODIGO_REQUERIDO",
          error: "Ingresa el código del cupón o escanea el código QR.",
        },
        { status: 400 }
      );
    }

    const rawClean = codigo.trim().toUpperCase();
    const normalizedCode = rawClean.startsWith("CANJE-")
      ? rawClean
      : `CANJE-${rawClean}`;

    let encontrado = await prisma.canjePremio.findUnique({
      where: { codigoQR: normalizedCode },
      include: includeCanje,
    });

    if (!encontrado) {
      encontrado = await prisma.canjePremio.findUnique({
        where: { codigoQR: rawClean },
        include: includeCanje,
      });
    }

    const canje = encontrado;

    if (!canje) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_FOUND",
          error: `No se encontró ningún cupón con el código "${rawClean}".`,
        },
        { status: 404 }
      );
    }

    if (canje.estado === EstadoCanje.COMPLETADO) {
      return NextResponse.json(
        {
          success: false,
          code: "YA_COMPLETADO",
          error: "Este cupón ya fue canjeado y entregado con anterioridad.",
          yaCompletado: true,
          fechaCanje: canje.fechaCanje,
        },
        { status: 400 }
      );
    }

    if (canje.estado === EstadoCanje.CANCELADO) {
      return NextResponse.json(
        {
          success: false,
          code: "CANCELADO",
          error: "El socio ha cancelado este cupón voluntariamente.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    if (canje.estado === EstadoCanje.EXPIRADO || now > canje.fechaExpiracion) {
      if (canje.estado !== EstadoCanje.EXPIRADO) {
        await prisma.canjePremio.update({
          where: { id: canje.id },
          data: { estado: EstadoCanje.EXPIRADO },
        });
      }
      return NextResponse.json(
        {
          success: false,
          code: "EXPIRADO",
          error:
            "El cupón ha expirado. Han transcurrido más de 15 minutos desde su emisión.",
        },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const reclamado = await tx.canjePremio.updateMany({
        where: {
          id: canje.id,
          estado: EstadoCanje.PENDIENTE,
          fechaExpiracion: { gt: now },
        },
        data: {
          estado: EstadoCanje.COMPLETADO,
          validadoPorId: session.id,
          fechaCanje: now,
        },
      });

      if (reclamado.count === 0) {
        const actual = await tx.canjePremio.findUnique({
          where: { id: canje.id },
        });
        if (!actual) {
          throw new ApiError(
            404,
            "NOT_FOUND",
            `No se encontró ningún cupón con el código "${rawClean}".`
          );
        }
        if (actual.estado === EstadoCanje.COMPLETADO) {
          throw new ApiError(
            400,
            "YA_COMPLETADO",
            "Este cupón ya fue canjeado y entregado con anterioridad.",
            { yaCompletado: true, fechaCanje: actual.fechaCanje }
          );
        }
        if (actual.estado === EstadoCanje.CANCELADO) {
          throw new ApiError(
            400,
            "CANCELADO",
            "El socio ha cancelado este cupón voluntariamente."
          );
        }
        throw new ApiError(
          400,
          "EXPIRADO",
          "El cupón ha expirado. Han transcurrido más de 15 minutos desde su emisión."
        );
      }

      const debitado = await tx.socio.updateMany({
        where: {
          id: canje.socio.id,
          puntosActuales: { gte: canje.puntosGastados },
        },
        data: {
          puntosActuales: { decrement: canje.puntosGastados },
        },
      });

      if (debitado.count === 0) {
        const saldo = await tx.socio.findUnique({
          where: { id: canje.socio.id },
        });
        throw new ApiError(
          400,
          "SALDO_INSUFICIENTE",
          `El socio no posee saldo suficiente (${
            saldo?.puntosActuales ?? 0
          } pts vs ${canje.puntosGastados} pts requeridos).`
        );
      }

      if (canje.premio.stock !== -1) {
        const stockOk = await tx.premio.updateMany({
          where: { id: canje.premio.id, stock: { gt: 0 } },
          data: {
            stock: { decrement: 1 },
          },
        });

        if (stockOk.count === 0) {
          throw new ApiError(
            400,
            "SIN_STOCK",
            `El premio "${canje.premio.titulo}" no cuenta con stock disponible en este momento.`
          );
        }
      }

      await tx.transaccionPuntos.create({
        data: {
          socioId: canje.socio.id,
          registradoPorId: session.id,
          tipo: TipoTransaccion.CANJE_PREMIO,
          puntos: -canje.puntosGastados,
          motivo: `Canje de premio en salón: ${canje.premio.titulo}`,
        },
      });

      const socioTrasDebito = await tx.socio.findUnique({
        where: { id: canje.socio.id },
      });

      return { nuevoSaldo: socioTrasDebito?.puntosActuales ?? 0 };
    });

    return NextResponse.json({
      success: true,
      canje: {
        id: canje.id,
        codigoQR: canje.codigoQR,
        premio: canje.premio.titulo,
        puntosDebitado: canje.puntosGastados,
        socio: {
          nombre: `${canje.socio.nombre} ${canje.socio.apellido || ""}`.trim(),
          dni: canje.socio.dni,
          nuevoSaldo: resultado.nuevoSaldo,
        },
        fechaCanje: now,
        validadoPor: session.nombre,
      },
      message: "¡Cupón validado con éxito! Premio listo para entregar.",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    console.error("Error en validación de canje POS:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Error de servidor al validar el cupón.",
      },
      { status: 500 }
    );
  }
}
