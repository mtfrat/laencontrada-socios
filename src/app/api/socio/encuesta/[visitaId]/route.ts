import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSocioSession } from "@/lib/auth";
import { TipoTransaccion } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ visitaId: string }> }
) {
  try {
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

    const { visitaId } = await params;

    const config = await prisma.configuracionPuntos.findFirst();

    // 1. Verificar si las encuestas est�n activas globalmente
    if (config && config.encuestaActiva === false) {
      return NextResponse.json(
        { success: false, error: "Las encuestas se encuentran moment�neamente pausadas por la administraci�n." },
        { status: 403 }
      );
    }

    // 2. Verificar regla de frecuencia: �1 sola vez en la vida del socio?
    if (config && config.encuestaUnaVezPorSocio === true) {
      const yaRespondioAlguna = await prisma.respuestaEncuesta.count({
        where: { socioId: session.id },
      });
      if (yaRespondioAlguna > 0) {
        return NextResponse.json({
          success: true,
          yaRespondida: true,
          mensajeFrecuencia: "Ya has participado en la encuesta de satisfacci�n anteriormente.",
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
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 });
    }

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

    // 1. Verificar si las encuestas est�n activas
    if (config && config.encuestaActiva === false) {
      return NextResponse.json(
        { success: false, error: "Las encuestas se encuentran pausadas por la administraci�n." },
        { status: 403 }
      );
    }

    // 2. Verificar regla de solo 1 vez por socio en su vida
    if (config && config.encuestaUnaVezPorSocio === true) {
      const yaRespondioAlguna = await prisma.respuestaEncuesta.count({
        where: { socioId: session.id },
      });
      if (yaRespondioAlguna > 0) {
        return NextResponse.json(
          { success: false, error: "Solo se permite responder la encuesta 1 vez por socio." },
          { status: 400 }
        );
      }
    }

    const visita = await prisma.visitaConsumo.findUnique({
      where: { id: visitaId },
      include: { respuestaEncuesta: true },
    });

    if (!visita || visita.socioId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Visita no encontrada." },
        { status: 404 }
      );
    }

    if (visita.respuestaEncuesta) {
      return NextResponse.json(
        { success: false, error: "Esta visita ya fue evaluada previamente." },
        { status: 400 }
      );
    }

    const puntosAcreditar = config?.puntosPorEncuesta || 10;

    // Ejecutar transacci�n en Supabase
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear respuesta de encuesta
      const nuevaRespuesta = await tx.respuestaEncuesta.create({
        data: {
          visitaConsumoId: visitaId,
          socioId: session.id,
          puntosOtorgados: puntosAcreditar,
          comentarios: comentarios ? String(comentarios).trim() : null,
          items: {
            create: respuestas.map((r: { preguntaId: string; puntuacion: number }) => ({
              preguntaId: r.preguntaId,
              puntuacion: Math.min(5, Math.max(1, Number(r.puntuacion) || 5)),
            })),
          },
        },
      });

      // 2. Acreditar puntos al socio
      await tx.socio.update({
        where: { id: session.id },
        data: {
          puntosActuales: { increment: puntosAcreditar },
          puntosHistoricos: { increment: puntosAcreditar },
        },
      });

      // 3. Registrar en el libro mayor de auditor�a
      await tx.transaccionPuntos.create({
        data: {
          socioId: session.id,
          tipo: TipoTransaccion.ENCUESTA,
          puntos: puntosAcreditar,
          motivo: "Bono por responder encuesta de satisfacci�n gastron�mica",
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
    console.error("Error enviando encuesta:", error);
    return NextResponse.json(
      { success: false, error: "Ocurri� un error al procesar tu calificaci�n." },
      { status: 500 }
    );
  }
}
