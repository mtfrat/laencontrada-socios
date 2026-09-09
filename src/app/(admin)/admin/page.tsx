import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import AdminMetricsDashboard, { MetricsData } from "@/components/admin/AdminMetricsDashboard";
import {
  Users,
  Gift,
  Settings,
  Database,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
  UtensilsCrossed,
  UserCog,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/pos");
  }

  // Agregaciones y Métricas Reales desde Supabase
  const [
    totalSocios,
    totalPremios,
    configPuntos,
    totalStaff,
    financialsAgg,
    pointsAgg,
    canjesAgg,
    shiftsAgg,
    topPremiosRaw,
    topSociosRaw,
    recentVisitasRaw,
    recentCanjesRaw,
  ] = await Promise.all([
    prisma.socio.count(),
    prisma.premio.count({ where: { activo: true } }),
    prisma.configuracionPuntos.findFirst(),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.visitaConsumo.aggregate({
      _sum: {
        montoTotalTicket: true,
        cantidadComensales: true,
      },
      _avg: {
        montoTotalTicket: true,
        gastoPromedioPorPersona: true,
      },
      _count: {
        id: true,
      },
    }),
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
    prisma.visitaConsumo.groupBy({
      by: ["franjaHoraria"],
      _count: {
        id: true,
      },
    }),
    prisma.premio.findMany({
      take: 5,
      orderBy: {
        canjes: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        titulo: true,
        puntosRequeridos: true,
        stock: true,
        _count: {
          select: { canjes: true },
        },
      },
    }),
    prisma.socio.findMany({
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
      take: 3,
      orderBy: {
        createdAt: "desc",
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

  // Procesamiento de Indicadores Financieros
  const totalFacturado = Number(financialsAgg._sum.montoTotalTicket || 0);
  const totalVisitas = financialsAgg._count.id || 0;
  const totalComensales = financialsAgg._sum.cantidadComensales || 0;
  const ticketPromedio = totalVisitas > 0 ? Math.round(Number(financialsAgg._avg.montoTotalTicket || 0)) : 0;
  const gastoPromedioComensal =
    totalVisitas > 0 ? Math.round(Number(financialsAgg._avg.gastoPromedioPorPersona || 0)) : 0;

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

  shiftsAgg.forEach((s) => {
    if (shiftsMap[s.franjaHoraria]) {
      shiftsMap[s.franjaHoraria].count = s._count.id;
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
  }));

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
      fecha: new Date(c.createdAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
    })),
  ].slice(0, 6);

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
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="La Encontrada"
              width={34}
              height={34}
              className="drop-shadow-[0_1px_6px_rgba(92,19,29,0.5)]"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-serif">Panel de Administración</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#e18693] border border-[#5c131d]/50 font-semibold">
                  Gerencia
                </span>
              </div>
              <p className="text-xs text-stone-400">Usuario: {session.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="text-xs bg-stone-900 hover:bg-stone-800 text-[#ce7281] px-3 py-1.5 rounded-xl border border-[#5c131d]/40 transition"
            >
              Terminal de Salón
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Tablero Gerencial • La Encontrada Wine Bistro
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Métricas ejecutivas de ventas en salón, motor de fidelización, hábitos de consumo y acceso a módulos.
          </p>
        </div>

        {/* COMPONENTE INTERACTIVO DE MÉTRICAS Y KPIS */}
        <AdminMetricsDashboard data={metricsData} />

        {/* Sección de Módulos Operativos */}
        <div className="space-y-4 pt-4 border-t border-[#5c131d]/20">
          <div>
            <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider">
              Módulos de Gestión del Restaurante
            </h2>
            <p className="text-xs text-stone-400">Acceso rápido a las herramientas de control y configuración.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Module: Socios & Importación */}
            <Link
              href="/admin/socios"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                    Base de Socios
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#d4aa58] border border-[#5c131d]/50 font-bold">
                    {totalSocios} socios
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                  Padrón completo, exportación a Excel en CSV y ajuste manual de puntos con auditoría.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Gestionar Padrón</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Module: Catálogo de Premios */}
            <Link
              href="/admin/premios"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                    Catálogo de Premios
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#d4aa58] border border-[#5c131d]/50 font-bold">
                    {totalPremios} activos
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                  Administración de recompensas gastronómicas, costos en puntos y control de stock.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Ver Catálogo</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Module: Personal & Mozos */}
            <Link
              href="/admin/usuarios"
              className="bg-[#0d0708] rounded-2xl p-5 border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <UserCog className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-[#e18693] transition">
                    Equipo & Mozos
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#d4aa58] border border-[#5c131d]/50 font-bold">
                    {totalStaff} activos
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                  Altas de mozos y cajeros, cambio de contraseñas y permisos para la terminal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-[#ce7281]">
                <span>Administrar Personal</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

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
        </div>
      </main>
    </div>
  );
}
