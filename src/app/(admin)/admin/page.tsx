import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import { ShieldCheck, Users, Gift, Settings, Database, ArrowUpRight, TrendingUp, HelpCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/pos");
  }

  // Métricas reales desde Supabase
  const [totalSocios, totalPremios, configPuntos] = await Promise.all([
    prisma.socio.count(),
    prisma.premio.count({ where: { activo: true } }),
    prisma.configuracionPuntos.findFirst(),
  ]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-16">
      {/* Admin Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Panel de Administración</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Gerencia
                </span>
              </div>
              <p className="text-xs text-stone-400">Usuario: {session.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-xl border border-stone-700 transition"
            >
              Ir a Terminal Mozos
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-100">
            Tablero de Control • La Encontrada
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Gestión de socios, reglas del motor de fidelización, catálogo y auditoría.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/socios"
            className="bg-stone-900 rounded-2xl p-5 border border-stone-800 hover:border-amber-500/40 transition flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-medium text-stone-400 group-hover:text-amber-400 transition">Socios Registrados</p>
              <p className="text-3xl font-extrabold text-stone-100 font-mono mt-1">
                {totalSocios}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Ver padrón ({totalSocios}) →
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center transition">
              <Users className="w-6 h-6" />
            </div>
          </Link>

          <Link
            href="/admin/premios"
            className="bg-stone-900 rounded-2xl p-5 border border-stone-800 hover:border-amber-500/40 transition flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-medium text-stone-400 group-hover:text-amber-400 transition">Premios en Catálogo</p>
              <p className="text-3xl font-extrabold text-stone-100 font-mono mt-1">
                {totalPremios}
              </p>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                Ver catálogo →
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center transition">
              <Gift className="w-6 h-6" />
            </div>
          </Link>

          <Link
            href="/admin/configuracion"
            className="bg-stone-900 rounded-2xl p-5 border border-stone-800 hover:border-amber-500/40 transition flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-medium text-stone-400 group-hover:text-amber-400 transition">Ratio de Puntos</p>
              <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
                ${Number(configPuntos?.pesosPorPunto || 1000).toLocaleString("es-AR")}
              </p>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                Ajustar reglas →
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center transition">
              <Settings className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Modules Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Module: Socios & Importación */}
          <Link
            href="/admin/socios"
            className="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-amber-500/40 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center mb-3 transition">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-300 transition">Base de Socios & Auditoría</h3>
              <p className="text-stone-400 text-sm mt-1">
                Visualiza el padrón completo de socios, busca por DNI o número de membresía y ajusta saldos de puntos manualmente.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-amber-400">
              <span>Gestionar Socios & Puntos</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Module: Configuración de Reglas */}
          <Link
            href="/admin/configuracion"
            className="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-amber-500/40 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center mb-3 transition">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-300 transition">Reglas del Restaurante</h3>
              <p className="text-stone-400 text-sm mt-1">
                Ajuste de ratio de conversión pesos/puntos ($1.000 = 1 punto), vigencia de cupones QR y parámetros comerciales.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-amber-400">
              <span>Configurar Reglas del Salón</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Module: Encuestas Editables */}
          <Link
            href="/admin/encuestas"
            className="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-amber-500/40 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-300 transition">
                Encuesta de Satisfacción Editable
              </h3>
              <p className="text-stone-400 text-sm mt-1">
                Crea o modifica las preguntas que responderán los socios al terminar su consumo y ajusta los puntos de premio.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-amber-400">
              <span>Personalizar Preguntas & Puntos</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Module: Historial Gastronómico & Platos */}
          <Link
            href="/admin/visitas"
            className="md:col-span-2 bg-gradient-to-r from-stone-900 to-amber-950/40 rounded-2xl p-6 border border-amber-500/30 hover:border-amber-500/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase font-semibold">Tiempo 2 • Salón & Caja</span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-amber-300 transition">
                Historial Gastronómico & Carga de Platos
              </h3>
              <p className="text-stone-400 text-sm mt-1">
                Abrí cualquier mesa cobrada en el salón para detallar qué platos consumió el socio y asociar el comprobante fiscal.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 shrink-0 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/30 group-hover:bg-amber-500/20 transition">
              <span>Gestionar Visitas</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
