import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { EstadoCanje, TipoTransaccion } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json(
        { success: false, error: "Ingresa el código del cupón o escanea el código QR." },
        { status: 400 }
      );
    }

    // Normalizar código: convertir a mayúsculas y limpiar espacios
    const rawClean = codigo.trim().toUpperCase();
    // Si viene sin el prefijo CANJE-, agregar o buscar por endsWith
    const normalizedCode = rawClean.startsWith("CANJE-") ? rawClean : `CANJE-${rawClean}`;

    // Buscar el canje por código exacto o alternativo
    let canje = await prisma.canjePremio.findUnique({
      where: { codigoQR: normalizedCode },
      include: {
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
      },
    });

    if (!canje) {
      // Intentar buscar directo por si el código no llevaba el prefijo
      canje = await prisma.canjePremio.findUnique({
        where: { codigoQR: rawClean },
        include: {
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
        },
      });
    }

    if (!canje) {
      return NextResponse.json(
        { success: false, error: `No se encontró ningún cupón con el código "${rawClean}".` },
        { status: 404 }
      );
    }

    // Comprobaciones de estado
    if (canje.estado === EstadoCanje.COMPLETADO) {
      return NextResponse.json(
        {
          success: false,
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
          error: "El socio ha cancelado este cupón voluntariamente.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    if (canje.estado === EstadoCanje.EXPIRADO || now > canje.fechaExpiracion) {
      // Asegurar que esté marcado como EXPIRADO en BD
      if (canje.estado !== EstadoCanje.EXPIRADO) {
        await prisma.canjePremio.update({
          where: { id: canje.id },
          data: { estado: EstadoCanje.EXPIRADO },
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: "El cupón ha expirado. Han transcurrido más de 15 minutos desde su emisión.",
        },
        { status: 400 }
      );
    }

    // Comprobación de saldo del socio
    if (canje.socio.puntosActuales < canje.puntosGastados) {
      return NextResponse.json(
        {
          success: false,
          error: `El socio no posee saldo suficiente (${canje.socio.puntosActuales} pts vs ${canje.puntosGastados} pts requeridos).`,
        },
        { status: 400 }
      );
    }

    // Comprobación de stock
    if (canje.premio.stock === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `El premio "${canje.premio.titulo}" no cuenta con stock disponible en este momento.`,
        },
        { status: 400 }
      );
    }

    // Transacción atómica de validación
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Marcar canje como COMPLETADO
      const canjeActualizado = await tx.canjePremio.update({
        where: { id: canje.id },
        data: {
          estado: EstadoCanje.COMPLETADO,
          validadoPorId: session.id,
          fechaCanje: now,
        },
      });

      // 2. Debitar puntos del socio
      const socioActualizado = await tx.socio.update({
        where: { id: canje.socio.id },
        data: {
          puntosActuales: {
            decrement: canje.puntosGastados,
          },
        },
      });

      // 3. Descontar stock del premio si no es ilimitado
      if (canje.premio.stock > 0) {
        await tx.premio.update({
          where: { id: canje.premio.id },
          data: {
            stock: {
              decrement: 1,
            },
          },
        });
      }

      // 4. Registrar transacción en auditoría de puntos
      await tx.transaccionPuntos.create({
        data: {
          socioId: canje.socio.id,
          registradoPorId: session.id,
          tipo: TipoTransaccion.CANJE_PREMIO,
          puntos: -canje.puntosGastados,
          motivo: `Canje de premio en salón: ${canje.premio.titulo}`,
        },
      });

      return { canjeActualizado, nuevoSaldo: socioActualizado.puntosActuales };
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
    console.error("Error en validación de canje POS:", error);
    return NextResponse.json(
      { success: false, error: "Error de servidor al validar el cupón." },
      { status: 500 }
    );
  }
}