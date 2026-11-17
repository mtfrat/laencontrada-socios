import { redirect } from "next/navigation";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MemberDashboardView from "@/components/socio/MemberDashboardView";

export default async function SocioDashboardPage() {
  const session = await getSocioSession();
  if (!session) redirect("/socio/login");

  const [socio, config] = await Promise.all([prisma.socio.findUnique({
    where: { id: session.id },
    include: {
      transacciones: { take: 5, orderBy: { createdAt: "desc" } },
    },
  }), prisma.configuracionPuntos.findFirst({
    select: { encuestaActiva: true, encuestaUnaVezPorSocio: true },
  })]);
  if (!socio || !socio.activo) redirect("/socio/login");

  const yaRespondio = config?.encuestaUnaVezPorSocio
    ? await prisma.respuestaEncuesta.count({ where: { socioId: session.id } }) > 0
    : false;
  const visitaPendiente = config?.encuestaActiva === false || yaRespondio
    ? null
    : await prisma.visitaConsumo.findFirst({
        where: { socioId: session.id, respuestaEncuesta: { is: null } },
        orderBy: { fechaVisita: "desc" },
        select: { id: true },
      });
  const encuestaPendienteId = visitaPendiente?.id;
  return <MemberDashboardView socio={{
    nombre: socio.nombre,
    apellido: socio.apellido,
    numeroSocio: socio.numeroSocio,
    puntosActuales: socio.puntosActuales,
    puntosHistoricos: socio.puntosHistoricos,
    transacciones: socio.transacciones,
    encuestaPendienteId,
  }} />;
}
