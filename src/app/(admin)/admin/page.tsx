import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffHeader from "@/components/staff/StaffHeader";
import AdminMetricsDashboard, { MetricsData } from "@/components/admin/AdminMetricsDashboard";
import {
  Users,
  Gift,
  Settings,
  ArrowUpRight,
  HelpCircle,
  UtensilsCrossed,
  UserCog,
  MessageSquare,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/pos");
  }

  // Agregaciones y Métricas Reales desde Supabase
  const [
    totalSocios,
    totalPremios,
    configPuntos,
    totalStaff,
    visitasFinancierasRaw,
    pointsAgg,
    canjesAgg,
    topPremiosRaw,
    topSociosRaw,
    recentVisitasRaw,
    recentCanjesRaw,
  ] = await Promise.all([
    prisma.socio.count(),
    prisma.premio.count({ where: { activo: true } }),
    prisma.configuracionPuntos.findFirst(),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.$queryRaw<
      Array<{
        franjaHoraria: string;
        totalVisitas: number;
        totalFacturado: number;
        totalComensales: number;
      }>
    >`
      WITH visitas_unicas AS (
        SELECT DISTINCT ON (
          COALESCE(NULLIF(BTRIM(ticket."numeroTicketFiscal"), ''), visita."id")
        )
          visita."franjaHoraria"::text AS "franjaHoraria",
          visita."montoTotalTicket" AS "montoTotalTicket",
          visita."cantidadComensales" AS "cantidadComensales"
        FROM public."VisitaConsumo" AS visita
        LEFT JOIN public."TicketAdjunto" AS ticket
          ON ticket."visitaConsumoId" = visita."id"
        ORDER BY
          COALESCE(NULLIF(BTRIM(ticket."numeroTicketFiscal"), ''), visita."id"),
          visita."fechaVisita" ASC,
          visita."id" ASC
      )
      SELECT
        "franjaHoraria",
        COUNT(*)::int AS "totalVisitas",
        SUM("montoTotalTicket")::float8 AS "totalFacturado",
        SUM("cantidadComensales")::int AS "totalComensales"
      FROM visitas_unicas
      GROUP BY "franjaHoraria"
    `,
    prisma.socio.aggregate({
      _sum: {
        puntosActuales: true,
        puntosHistoricos: true,
      },
    }),
    prisma.canjePremio.aggregate({
      where: { estado: "COMPLETADO" },
      _sum: {
        puntosGastados: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.premio.findMany({
      select: {
        id: true,
        titulo: true,
        puntosRequeridos: true,
        stock: true,
        _count: {
          select: { canjes: { where: { estado: "COMPLETADO" } } },
        },
      },
    }),
    prisma.socio.findMany({
      where: { activo: true },
      take: 5,
      orderBy: {
        puntosHistoricos: "desc",
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        numeroSocio: true,
        puntosActuales: true,
        _count: {
          select: { visitas: true },
        },
      },
    }),
    prisma.visitaConsumo.findMany({
      take: 3,
      orderBy: {
        fechaVisita: "desc",
      },
      include: {
        socio: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    }),
    prisma.canjePremio.findMany({
      where: { estado: "COMPLETADO" },
      take: 3,
      orderBy: {
        fechaCanje: "desc",
      },
      include: {
        socio: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        premio: {
          select: {
            titulo: true,
          },
        },
      },
    }),
  ]);

  // Una mesa puede generar una visita por socio. La consulta agrupa por factura
  // en la base para que ticket y comensales cuenten una sola vez sin cargar todo
  // el historial de visitas en memoria.
  const totalFacturado = visitasFinancierasRaw.reduce(
    (total, grupo) => total + Number(grupo.totalFacturado),
    0,
  );
  const totalVisitas = visitasFinancierasRaw.reduce((total, grupo) => total + grupo.totalVisitas, 0);
  const totalComensales = visitasFinancierasRaw.reduce((total, grupo) => total + grupo.totalComensales, 0);
  const ticketPromedio = totalVisitas > 0 ? Math.round(totalFacturado / totalVisitas) : 0;
  const gastoPromedioComensal = totalComensales > 0 ? Math.round(totalFacturado / totalComensales) : 0;

  // Procesamiento de Balance de Puntos
  const puntosCirculacion = pointsAgg._sum.puntosActuales || 0;
  const puntosEmitidos = pointsAgg._sum.puntosHistoricos || 0;
  const puntosCanjeados = canjesAgg._sum.puntosGastados || 0;
  const tasaCanje =
    puntosEmitidos > 0 ? Math.round((puntosCanjeados / puntosEmitidos) * 100) : 0;
  const pesosPorPunto = Number(configPuntos?.pesosPorPunto || 1000);

  // Procesamiento de Turnos
  const shiftsMap: Record<string, { label: string; count: number }> = {
    CENA: { label: "Cena (Noche)", count: 0 },
    ALMUERZO: { label: "Almuerzo (Mediodía)", count: 0 },
    TARDE: { label: "Tarde / After", count: 0 },
    OTRO: { label: "Otros Horarios", count: 0 },
  };

  visitasFinancierasRaw.forEach((grupo) => {
    if (shiftsMap[grupo.franjaHoraria]) {
      shiftsMap[grupo.franjaHoraria].count = grupo.totalVisitas;
    }
  });

  const shiftsBreakdown = Object.entries(shiftsMap).map(([turno, info]) => ({
    turno,
    label: info.label,
    count: info.count,
    percentage: totalVisitas > 0 ? Math.round((info.count / totalVisitas) * 100) : 0,
  }));

  // Top Premios
  const topPremios = topPremiosRaw.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    puntosRequeridos: p.puntosRequeridos,
    totalCanjes: p._count.canjes,
    stock: p.stock,
  })).sort((a, b) => b.totalCanjes - a.totalCanjes).slice(0, 5);

  // Top Socios
  const topSocios = topSociosRaw.map((s) => ({
    id: s.id,
    nombre: `${s.nombre} ${s.apellido || ""}`.trim(),
    numeroSocio: s.numeroSocio,
    puntosActuales: s.puntosActuales,
    totalVisitas: s._count.visitas,
  }));

  // Actividad Reciente Unificada
  const recentActivity: MetricsData["recentActivity"] = [
    ...recentVisitasRaw.map((v) => ({
      id: v.id,
      tipo: "VISITA" as const,
      socioNombre: `${v.socio.nombre} ${v.socio.apellido || ""}`.trim(),
      detalle: `Consumo en salón ($${Number(v.montoTotalTicket).toLocaleString("es-AR")})`,
      puntos: v.puntosAcreditados,
      sortAt: new Date(v.fechaVisita).getTime(),
      fecha: new Date(v.fechaVisita).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
    })),
    ...recentCanjesRaw.map((c) => ({
      id: c.id,
      tipo: "CANJE" as const,
      socioNombre: `${c.socio.nombre} ${c.socio.apellido || ""}`.trim(),
      detalle: `Canje: ${c.premio.titulo}`,
      puntos: c.puntosGastados,
      sortAt: new Date(c.fechaCanje ?? c.createdAt).getTime(),
      fecha: new Date(c.fechaCanje ?? c.createdAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
    })),
  ].sort((a, b) => b.sortAt - a.sortAt).slice(0, 6);

  const metricsData: MetricsData = {
    financials: {
      totalFacturado,
      ticketPromedio,
      gastoPromedioComensal,
      totalComensales,
      totalVisitas,
    },
    pointsBalance: {
      puntosCirculacion,
      puntosEmitidos,
      puntosCanjeados,
      tasaCanje,
      pesosPorPunto,
    },
    shiftsBreakdown,
    topPremios,
    topSocios,
    recentActivity,
  };

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Admin Header with Official Logo */}
      <StaffHeader title="Panel del administrador" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} actions={[{ href: "/pos", label: "Terminal de salón", icon: "terminal" }]} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        <div>
          <p className="mb-1 text-sm font-medium text-[#d4aa58]">La Encontrada · El Bolsón</p>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight sm:text-4xl">
            Administración del restaurante
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Gestioná socios, puntos, premios y equipo. Consultá abajo la actividad registrada.
          </p>
        </div>

        <section aria-labelledby="acciones-frecuentes" className="space-y-3">
          <h2 id="acciones-frecuentes" className="text-xl font-semibold text-white sm:text-2xl">Acciones frecuentes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { href: "/pos", label: "Cargar puntos", detail: "Mesa o ticket", icon: UtensilsCrossed },
              { href: "/admin/socios", label: "Socios", detail: `${totalSocios} registrados`, icon: Users },
              { href: "/admin/premios", label: "Premios", detail: `${totalPremios} activos`, icon: Gift },
              { href: "/admin/usuarios", label: "Equipo", detail: `${totalStaff} cuentas activas`, icon: UserCog },
              { href: "/staff/chat", label: "Chat interno", detail: "Hablar con el equipo", icon: MessageSquare },
            ].map(({ href, label, detail, icon: Icon }) => (
              <Link key={href} href={href} className="staff-task-card group flex min-h-28 flex-col justify-between rounded-2xl border border-[#6c3437]/60 bg-[#1b1012] p-4 transition hover:border-[#d4aa58]/70 hover:bg-[#261417]">
                <div className="flex items-start justify-between text-[#d4aa58]"><Icon size={20} aria-hidden="true" /><ArrowUpRight size={16} className="text-stone-500 transition group-hover:text-[#d4aa58]" aria-hidden="true" /></div>
                <div><h3 className="text-sm font-semibold text-white">{label}</h3><p className="text-xs text-stone-400">{detail}</p></div>
              </Link>
            ))}
          </div>
        </section>

        {/* COMPONENTE INTERACTIVO DE MÉTRICAS Y KPIS */}
        <section aria-labelledby="resumen-restaurante" className="space-y-4">
          <div><h2 id="resumen-restaurante" className="text-xl font-semibold text-white sm:text-2xl">Resumen del restaurante</h2><p className="text-sm text-stone-400">Consumos, puntos y premios registrados.</p></div>
          <AdminMetricsDashboard data={metricsData} />
        </section>

        {/* Sección de Módulos Operativos */}
        <section aria-labelledby="mas-herramientas" className="space-y-4 pt-4 border-t border-[#5c131d]/20">
          <div>
            <h2 id="mas-herramientas" className="text-xl font-semibold text-white sm:text-2xl">
              Más herramientas
            </h2>
            <p className="text-sm text-stone-400">Historial de visitas, reglas de puntos y encuestas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Module: Historial Gastronómico & Platos */}
            <Link
              href="/admin/visitas"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                  Historial Gastronómico
                </h3>
                <p className="text-stone-400 text-xs mt-1">
                  Detalle de platos consumidos en cada mesa y asociación de tickets fiscales.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Gestionar Visitas</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Module: Configuración de Reglas */}
            <Link
              href="/admin/configuracion"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                  Reglas del Restaurante
                </h3>
                <p className="text-stone-400 text-xs mt-1">
                  Ratio de puntos (${pesosPorPunto} = 1 pt), vigencia de QR y simulador de mesa.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Configurar Reglas</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Module: Encuestas Editables */}
            <Link
              href="/admin/encuestas"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                  Encuestas de Satisfacción
                </h3>
                <p className="text-stone-400 text-xs mt-1">
                  Personalizar preguntas para socios, bonificación de puntos y frecuencia.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Configurar Encuesta</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
