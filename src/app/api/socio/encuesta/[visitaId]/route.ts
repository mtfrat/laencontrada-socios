import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSocioSession } from "@/lib/guards";
import { TipoTransaccion } from "@prisma/client";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ visitaId: string }> }
) {
  try {
    const auth = await requireSocioSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { visitaId } = await params;

    const config = await prisma.configuracionPuntos.findFirst();

    // 1. Verificar si las encuestas están activas globalmente
    if (config && config.encuestaActiva === false) {
      return NextResponse.json(
        { success: false, error: "Las encuestas se encuentran momentáneamente pausadas por la administración." },
        { status: 403 }
      );
    }

    // 2. Verificar regla de frecuencia: ¿1 sola vez en la vida del socio?
    if (config && config.encuestaUnaVezPorSocio === true) {
      const yaRespondioAlguna = await prisma.respuestaEncuesta.count({
        where: { socioId: session.id },
      });
      if (yaRespondioAlguna > 0) {
        return NextResponse.json({
          success: true,
          yaRespondida: true,
          mensajeFrecuencia: "Ya has participado en la encuesta de satisfacción anteriormente.",
        });
      }
    }

    const visita = await prisma.visitaConsumo.findUnique({
      where: { id: visitaId },
      include: {
        respuestaEncuesta: {
          include: { items: true },
        },
      },
    });

    if (!visita || visita.socioId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Visita no encontrada o no pertenece a tu cuenta." },
        { status: 404 }
      );
    }

    // Si esta visita particular ya fue respondida
    if (visita.respuestaEncuesta) {
      return NextResponse.json({
        success: true,
        yaRespondida: true,
        respuesta: visita.respuestaEncuesta,
      });
    }

    // Cargar preguntas activas
    const preguntas = await prisma.preguntaEncuesta.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({
      success: true,
      yaRespondida: false,
      visita: {
        id: visita.id,
        fechaVisita: visita.fechaVisita,
        franjaHoraria: visita.franjaHoraria,
        montoTotalTicket: visita.montoTotalTicket,
      },
      preguntas,
      puntosPorEncuesta: config?.puntosPorEncuesta || 10,
    });
  } catch (error) {
    console.error("Error obteniendo encuesta de visita:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar la encuesta." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ visitaId: string }> }
) {
  try {
    const auth = await requireSocioSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { visitaId } = await params;
    const body = await request.json();
    const { respuestas, comentarios } = body;

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debes calificar al menos una pregunta." },
        { status: 400 }
      );
    }

    const config = await prisma.configuracionPuntos.findFirst();

    // 1. Verificar si las encuestas están activas
    if (config && config.encuestaActiva === false) {
      return NextResponse.json(
        {
          success: false,
          code: "ENCUESTA_PAUSADA",
          error: "Las encuestas se encuentran pausadas por la administración.",
        },
        { status: 403 }
      );
    }

    const unaVezPorSocio = config?.encuestaUnaVezPorSocio === true;

    const visita = await prisma.visitaConsumo.findUnique({
      where: { id: visitaId },
      include: { respuestaEncuesta: true },
    });

    if (!visita || visita.socioId !== session.id) {
      return NextResponse.json(
        { success: false, code: "VISITA_NO_ENCONTRADA", error: "Visita no encontrada." },
        { status: 404 }
      );
    }

    if (visita.respuestaEncuesta) {
      return NextResponse.json(
        {
          success: false,
          code: "ENCUESTA_YA_RESPONDIDA",
          error: "Esta visita ya fue evaluada previamente.",
        },
        { status: 400 }
      );
    }

    // Fast-path de la regla "solo 1 vez por socio" (autoritativo dentro de la transacción)
    if (unaVezPorSocio) {
      const yaRespondioAlguna = await prisma.respuestaEncuesta.count({
        where: { socioId: session.id },
      });
      if (yaRespondioAlguna > 0) {
        return NextResponse.json(
          {
            success: false,
            code: "SOLO_UNA_VEZ",
            error: "Solo se permite responder la encuesta 1 vez por socio.",
          },
          { status: 400 }
        );
      }
    }

    const puntosAcreditar = config?.puntosPorEncuesta || 10;

    const resultado = await prisma.$transaction(async (tx) => {
      // Lock de fila del socio: serializa envíos concurrentes del mismo socio
      const ahora = new Date();
      const socioOk = await tx.socio.updateMany({
        where: { id: session.id },
        data: { updatedAt: ahora },
      });
      if (socioOk.count === 0) {
        throw new ApiError(401, "UNAUTHORIZED", "No autorizado.");
      }

      // 2. Re-verificar pertenencia de la visita dentro de la transacción
      const visitaOk = await tx.visitaConsumo.updateMany({
        where: { id: visitaId, socioId: session.id },
        data: { updatedAt: ahora },
      });
      if (visitaOk.count === 0) {
        throw new ApiError(404, "VISITA_NO_ENCONTRADA", "Visita no encontrada.");
      }

      // 3. Regla "solo 1 vez por socio", autoritativa tras el lock (excluye la visita en curso)
      if (unaVezPorSocio) {
        const respondioOtra = await tx.respuestaEncuesta.count({
          where: {
            socioId: session.id,
            visitaConsumoId: { not: visitaId },
          },
        });
        if (respondioOtra > 0) {
          throw new ApiError(
            400,
            "SOLO_UNA_VEZ",
            "Solo se permite responder la encuesta 1 vez por socio."
          );
        }
      }

      // 4. Crear respuesta (la restricción única de visitaConsumoId impide duplicados)
      let nuevaRespuesta;
      try {
        nuevaRespuesta = await tx.respuestaEncuesta.create({
          data: {
            visitaConsumoId: visitaId,
            socioId: session.id,
            puntosOtorgados: puntosAcreditar,
            comentarios: comentarios ? String(comentarios).trim() : null,
          },
        });
      } catch (error) {
        if ((error as { code?: string })?.code === "P2002") {
          throw new ApiError(
            400,
            "ENCUESTA_YA_RESPONDIDA",
            "Esta visita ya fue evaluada previamente."
          );
        }
        throw error;
      }

      await tx.itemRespuestaEncuesta.createMany({
        data: respuestas.map((r: { preguntaId: string; puntuacion: number }) => ({
          respuestaEncuestaId: nuevaRespuesta.id,
          preguntaId: r.preguntaId,
          puntuacion: Math.min(5, Math.max(1, Number(r.puntuacion) || 5)),
        })),
      });

      // 5. Acreditar puntos al socio
      await tx.socio.update({
        where: { id: session.id },
        data: {
          puntosActuales: { increment: puntosAcreditar },
          puntosHistoricos: { increment: puntosAcreditar },
        },
      });

      // 6. Registrar en el libro mayor de auditoría
      await tx.transaccionPuntos.create({
        data: {
          socioId: session.id,
          tipo: TipoTransaccion.ENCUESTA,
          puntos: puntosAcreditar,
          motivo: "Bono por responder encuesta de satisfacción gastronómica",
        },
      });

      return nuevaRespuesta;
    });

    return NextResponse.json({
      success: true,
      puntosGanados: puntosAcreditar,
      respuestaId: resultado.id,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    console.error("Error enviando encuesta:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al procesar tu calificación." },
      { status: 500 }
    );
  }
}
