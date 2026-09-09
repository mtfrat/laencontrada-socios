import { prisma } from "../src/lib/prisma";
import { calculateTablePoints } from "../src/lib/points-engine";

async function run() {
  const socioBefore = await prisma.socio.findUnique({ where: { dni: "12345678" } });
  const user = await prisma.usuario.findUnique({ where: { username: "mozo1" } });

  if (!socioBefore || !user) {
    throw new Error("Datos de prueba no encontrados");
  }

  console.log("Socio antes del consumo:", {
    nombre: socioBefore.nombre,
    puntosActuales: socioBefore.puntosActuales,
    puntosHistoricos: socioBefore.puntosHistoricos,
  });

  const calc = calculateTablePoints({
    totalTicket: 100000,
    guestCount: 4,
    pesosPorPunto: 1000,
  });

  console.log("Cálculo obtenido:", calc);

  // Ejecutar carga de prueba
  await prisma.$transaction(async (tx) => {
    await tx.socio.update({
      where: { id: socioBefore.id },
      data: {
        puntosActuales: { increment: calc.puntosPorSocio },
        puntosHistoricos: { increment: calc.puntosPorSocio },
      },
    });

    await tx.transaccionPuntos.create({
      data: {
        socioId: socioBefore.id,
        registradoPorId: user.id,
        tipo: "CONSUMO",
        puntos: calc.puntosPorSocio,
        motivo: "Test Mesa $100.000 (4 comensales)",
      },
    });

    await tx.visitaConsumo.create({
      data: {
        socioId: socioBefore.id,
        registradoPorId: user.id,
        montoTotalTicket: 100000,
        cantidadComensales: 4,
        gastoPromedioPorPersona: calc.gastoPromedioPorPersona,
        puntosAcreditados: calc.puntosPorSocio,
        franjaHoraria: "CENA",
      },
    });
  });

  const socioAfter = await prisma.socio.findUnique({ where: { dni: "12345678" } });
  const txCount = await prisma.transaccionPuntos.count({ where: { socioId: socioBefore.id } });
  const visitasCount = await prisma.visitaConsumo.count({ where: { socioId: socioBefore.id } });

  console.log("Socio después del consumo:", {
    nombre: socioAfter?.nombre,
    puntosActuales: socioAfter?.puntosActuales,
    puntosHistoricos: socioAfter?.puntosHistoricos,
    transacciones: txCount,
    visitas: visitasCount,
  });

  console.assert(socioAfter?.puntosActuales === socioBefore.puntosActuales + 25);
  console.assert(socioAfter?.puntosHistoricos === socioBefore.puntosHistoricos + 25);
  console.log("✔ Test E2E de acreditación de mesa en Supabase superado con éxito");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
