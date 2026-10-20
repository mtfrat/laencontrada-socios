import { prisma } from "../src/lib/prisma";

async function run() {
  const socio = await prisma.socio.findUnique({ where: { dni: "12345678" } });
  if (!socio) throw new Error("Socio no encontrado");

  // Buscar la última visita del socio
  const visita = await prisma.visitaConsumo.findFirst({
    where: { socioId: socio.id },
    orderBy: { fechaVisita: "desc" },
  });

  if (!visita) throw new Error("No hay visitas para enriquecer");

  console.log("Visita antes del enriquecimiento:", {
    id: visita.id,
    fecha: visita.fechaVisita,
    monto: visita.montoTotalTicket,
    comensales: visita.cantidadComensales,
  });

  // Enriquecer con platos y comprobante (Tiempo 2)
  await prisma.$transaction(async (tx) => {
    // 1. Limpiar y agregar platos
    await tx.itemPlatoConsumido.deleteMany({ where: { visitaConsumoId: visita.id } });
    await tx.itemPlatoConsumido.createMany({
      data: [
        { visitaConsumoId: visita.id, nombrePlato: "Ojo de bife", cantidad: 2, notas: "Punto jugoso" },
        { visitaConsumoId: visita.id, nombrePlato: "Provoleta clásica", cantidad: 1, notas: "Bien dorada" },
        { visitaConsumoId: visita.id, nombrePlato: "Vino Malbec Reserva", cantidad: 1, notas: null },
      ],
    });

    // 2. Adjuntar comprobante fiscal
    await tx.ticketAdjunto.upsert({
      where: { visitaConsumoId: visita.id },
      create: {
        visitaConsumoId: visita.id,
        numeroTicketFiscal: "FAC-B-0002-00019283",
        urlArchivo: "https://ejemplo.com/tickets/ticket-01.jpg",
      },
      update: {
        numeroTicketFiscal: "FAC-B-0002-00019283",
        urlArchivo: "https://ejemplo.com/tickets/ticket-01.jpg",
      },
    });

    // 3. Actualizar notas
    await tx.visitaConsumo.update({
      where: { id: visita.id },
      data: { notas: "Mesa 4 en salón principal - Clientes habituales" },
    });
  });

  // Consultar la visita con todas sus relaciones
  const visitaEnriquecida = await prisma.visitaConsumo.findUnique({
    where: { id: visita.id },
    include: {
      platos: true,
      ticketAdjunto: true,
    },
  });

  console.log("Visita después del enriquecimiento:", {
    id: visitaEnriquecida?.id,
    platosCount: visitaEnriquecida?.platos.length,
    platos: visitaEnriquecida?.platos.map((p) => `${p.cantidad}x ${p.nombrePlato} (${p.notas || "sin nota"})`),
    ticketFiscal: visitaEnriquecida?.ticketAdjunto?.numeroTicketFiscal,
    fotoTicket: visitaEnriquecida?.ticketAdjunto?.urlArchivo,
    notas: visitaEnriquecida?.notas,
  });

  if (visitaEnriquecida?.platos.length !== 3) {
    throw new Error(
      `Debe tener 3 platos, obtuvo ${visitaEnriquecida?.platos.length}`
    );
  }
  if (
    visitaEnriquecida?.ticketAdjunto?.numeroTicketFiscal !== "FAC-B-0002-00019283"
  ) {
    throw new Error(
      `Número de ticket fiscal incorrecto: obtuvo ${visitaEnriquecida?.ticketAdjunto?.numeroTicketFiscal}`
    );
  }
  console.log("✔ Test E2E de enriquecimiento de platos y ticket superado con éxito!");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
