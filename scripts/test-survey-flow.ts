import { prisma } from "../src/lib/prisma";

async function run() {
  const socio = await prisma.socio.findUnique({ where: { dni: "12345678" } });
  if (!socio) throw new Error("Socio no encontrado");

  const visita = await prisma.visitaConsumo.findFirst({
    where: { socioId: socio.id },
    include: { respuestaEncuesta: true },
  });

  if (!visita) throw new Error("Visita no encontrada");

  console.log("Socio antes de responder encuesta:", {
    puntosActuales: socio.puntosActuales,
    puntosHistoricos: socio.puntosHistoricos,
  });

  // Obtener preguntas activas
  const preguntas = await prisma.preguntaEncuesta.findMany({ where: { activa: true } });
  console.log("Preguntas activas en la encuesta:", preguntas.map((p) => p.texto));

  const config = await prisma.configuracionPuntos.findFirst();
  const puntosBono = config?.puntosPorEncuesta || 10;

  // Enviar respuestas de la encuesta
  await prisma.$transaction(async (tx) => {
    await tx.respuestaEncuesta.create({
      data: {
        visitaConsumoId: visita.id,
        socioId: socio.id,
        puntosOtorgados: puntosBono,
        comentarios: "Excelente experiencia, volveremos pronto",
        items: {
          create: preguntas.map((p) => ({
            preguntaId: p.id,
            puntuacion: 5,
          })),
        },
      },
    });

    await tx.socio.update({
      where: { id: socio.id },
      data: {
        puntosActuales: { increment: puntosBono },
        puntosHistoricos: { increment: puntosBono },
      },
    });

    await tx.transaccionPuntos.create({
      data: {
        socioId: socio.id,
        tipo: "ENCUESTA",
        puntos: puntosBono,
        motivo: "Bono por responder encuesta de satisfacción gastronómica",
      },
    });
  });

  const socioAfter = await prisma.socio.findUnique({
    where: { id: socio.id },
    include: {
      respuestasEncuesta: {
        include: { items: true },
      },
    },
  });

  console.log("Socio después de responder encuesta:", {
    puntosActuales: socioAfter?.puntosActuales,
    puntosHistoricos: socioAfter?.puntosHistoricos,
    encuestasRespondidas: socioAfter?.respuestasEncuesta.length,
    calificacionesGuardadas: socioAfter?.respuestasEncuesta[0]?.items.length,
  });

  if (socioAfter?.puntosActuales !== socio.puntosActuales + 10) {
    throw new Error(
      `puntosActuales incorrecto: esperaba ${socio.puntosActuales + 10}, obtuvo ${socioAfter?.puntosActuales}`
    );
  }
  if (socioAfter?.puntosHistoricos !== socio.puntosHistoricos + 10) {
    throw new Error(
      `puntosHistoricos incorrecto: esperaba ${socio.puntosHistoricos + 10}, obtuvo ${socioAfter?.puntosHistoricos}`
    );
  }
  console.log("✔ Test E2E de encuesta editable y bonificación de puntos superado con éxito!");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
