import { redirect } from "next/navigation";
import Link from "next/link";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SocioLogoutButton from "@/components/socio/LogoutButton";
import { Award, Gift, Trophy, Clock, UtensilsCrossed, Sparkles } from "lucide-react";

export default async function SocioDashboardPage() {
  const session = await getSocioSession();

  if (!session) {
    redirect("/socio/login");
  }

  // Obtener datos frescos del socio desde Supabase
  const socio = await prisma.socio.findUnique({
    where: { id: session.id },
    include: {
      transacciones: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      visitas: {
        take: 3,
        orderBy: { fechaVisita: "desc" },
        include: { platos: true },
      },
    },
  });

  if (!socio || !socio.activo) {
    redirect("/socio/login");
  }

  return (
    <div className="min-h-screen bg-[#fbf7f0] text-stone-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-amber-200/60 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-50 flex items-center justify-center font-serif font-bold text-sm">
              E
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-950 font-serif leading-none">
                La Encontrada
              </p>
              <p className="text-[10px] text-amber-800/70 font-medium">Club de Socios</p>
            </div>
          </div>
          <SocioLogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* Welcome Salutation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900">
              ¡Hola, {socio.nombre}!
            </h1>
            <p className="text-xs text-stone-500">Bienvenido a tu panel de beneficios</p>
          </div>
          <span className="text-[11px] font-mono bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
            {socio.numeroSocio}
          </span>
        </div>

        {/* Tarjeta Digital de Socio */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 text-amber-50 p-6 shadow-xl border border-amber-700/50">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-amber-300/80">
                Tarjeta Digital de Membresía
              </p>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                La Encontrada
              </h2>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>

          <div className="relative z-10 my-4">
            <p className="text-xs text-amber-200/80 font-medium">Puntos Disponibles para Canje</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl font-extrabold text-amber-300 tracking-tight font-mono">
                {socio.puntosActuales.toLocaleString("es-AR")}
              </span>
              <span className="text-xs font-semibold uppercase text-amber-200/70 tracking-wider">
                pts
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-amber-700/40 flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] text-amber-300/70 uppercase">Titular</p>
              <p className="font-semibold text-white tracking-wide">
                {socio.nombre} {socio.apellido || ""}
              </p>
              <p className="text-[10px] font-mono text-amber-200/60">DNI: {socio.dni}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-amber-300/70 uppercase">Puntos Históricos</p>
              <p className="font-mono font-bold text-amber-200">
                {socio.puntosHistoricos.toLocaleString("es-AR")} pts
              </p>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/socio/premios"
            className="p-4 bg-white rounded-2xl border border-amber-200/60 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Catálogo de Premios</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Canjeá tus puntos por cortesías</p>
            </div>
          </Link>

          <Link
            href="/socio/ranking"
            className="p-4 bg-white rounded-2xl border border-amber-200/60 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Ranking de Socios</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Líderes de fidelidad del mes</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-800" />
              Últimos Movimientos
            </h3>
            <Link
              href="/socio/historial"
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 transition"
            >
              Ver todo →
            </Link>
          </div>

          {socio.transacciones.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-xs">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              Todavía no registras consumos. ¡Cada visita a La Encontrada suma puntos!
            </div>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {socio.transacciones.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-800">{tx.motivo}</p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(tx.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      tx.puntos >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {tx.puntos > 0 ? `+${tx.puntos}` : tx.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mis Visitas y Experiencias Gastronómicas */}
        {socio.visitas.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-800" />
              Tus Platos y Experiencias en La Encontrada
            </h3>

            <div className="space-y-2.5">
              {socio.visitas.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-stone-50 border border-amber-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-stone-800">
                      Turno {v.franjaHoraria} • {v.cantidadComensales} {v.cantidadComensales === 1 ? "persona" : "personas"}
                    </span>
                    <span className="font-mono text-[11px] text-amber-800 font-bold">
                      +{v.puntosAcreditados} pts
                    </span>
                  </div>

                  {v.platos.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.platos.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
                        >
                          <span className="font-bold">{p.cantidad}x</span> {p.nombrePlato}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-400 italic">
                      Consumo promedio: ${Number(v.gastoPromedioPorPersona).toLocaleString("es-AR")} por persona
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Earn Points Tip */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-800" />
            ¿Cómo sumar más puntos en mesa?
          </p>
          <p className="text-amber-800/80">
            Al pedir la cuenta, recordale al mozo tu número de DNI. Si comparten la mesa con amigos o familia, el consumo se divide entre todos sumando puntos para vos y tus acompañantes.
          </p>
        </div>
      </main>
    </div>
  );
}
