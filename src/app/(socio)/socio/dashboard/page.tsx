import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SocioLogoutButton from "@/components/socio/LogoutButton";
import { Gift, Trophy, Clock, UtensilsCrossed, Sparkles, ChevronRight, Wine } from "lucide-react";

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
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header with Official Logo */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="La Encontrada Wine Bistro"
              width={38}
              height={38}
              className="drop-shadow-[0_2px_10px_rgba(92,19,29,0.5)]"
            />
            <div>
              <p className="text-xs font-serif font-bold text-white leading-none">
                La Encontrada
              </p>
              <p className="text-[10px] text-[#ce7281] font-semibold tracking-wider uppercase mt-0.5">
                Wine Bistro • Socios
              </p>
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
            <h1 className="text-xl font-serif font-bold text-white tracking-tight">
              ¡Hola, {socio.nombre}!
            </h1>
            <p className="text-xs text-stone-400">Bienvenido a tu membresía Wine Bistro</p>
          </div>
          <span className="text-[11px] font-mono bg-[#5c131d]/20 text-[#f5ede6] font-semibold px-3 py-1 rounded-full border border-[#5c131d]/40">
            {socio.numeroSocio}
          </span>
        </div>

        {/* Tarjeta Digital de Socio - Velvet Wine Bistro VIP Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5c131d] via-[#3a0b12] to-[#0d0406] text-white p-6 shadow-2xl border border-[#5c131d]/50">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-[#7a1a27]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-44 h-44 bg-[#5c131d]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="opacity-90"
              />
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#e18693]">
                  Membresía Exclusiva
                </p>
                <h2 className="text-base font-serif font-bold text-white tracking-wide">
                  La Encontrada
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-black/40 text-[#f5ede6] px-2 py-0.5 rounded-md border border-[#5c131d]/40">
              Socio Activo
            </span>
          </div>

          <div className="relative z-10 my-4">
            <p className="text-xs text-stone-300 font-medium">Puntos Disponibles para Canje</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#d4aa58] tracking-tight font-mono">
                {socio.puntosActuales.toLocaleString("es-AR")}
              </span>
              <span className="text-xs font-semibold uppercase text-stone-400 tracking-wider">
                pts
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">Titular</p>
              <p className="font-semibold text-white tracking-wide">
                {socio.nombre} {socio.apellido || ""}
              </p>
              <p className="text-[10px] font-mono text-stone-400">DNI: {socio.dni}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">Puntos Históricos</p>
              <p className="font-mono font-bold text-stone-200">
                {socio.puntosHistoricos.toLocaleString("es-AR")} pts
              </p>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/socio/premios"
            className="p-4 bg-[#0d0708] rounded-2xl border border-[#5c131d]/35 hover:border-[#5c131d] shadow-lg transition flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#e18693] border border-[#5c131d]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Catálogo de Premios</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Canjeá vinos, postres y cortesías</p>
            </div>
          </Link>

          <Link
            href="/socio/ranking"
            className="p-4 bg-[#0d0708] rounded-2xl border border-stone-800 hover:border-[#5c131d]/60 shadow-lg transition flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Ranking de Socios</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Líderes de fidelidad del bistró</p>
            </div>
          </Link>
        </div>

        {/* Acceso a Historial Completo */}
        <Link
          href="/socio/historial"
          className="p-4 bg-[#0d0708] rounded-2xl border border-stone-800 hover:border-[#5c131d]/60 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-300 border border-stone-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#ce7281]" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">Historial de Visitas & Consumos</p>
              <p className="text-[11px] text-stone-400">Tus mesas, platos degustados y encuestas</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </Link>

        {/* Últimos Movimientos */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Últimos Movimientos
            </h2>
            <Link href="/socio/historial" className="text-[11px] text-[#ce7281] hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="bg-[#0d0708] rounded-2xl border border-stone-800/80 divide-y divide-stone-800/60 overflow-hidden shadow-lg">
            {socio.transacciones.length === 0 ? (
              <div className="p-5 text-center text-xs text-stone-500">
                Aún no registras movimientos de puntos.
              </div>
            ) : (
              socio.transacciones.map((t) => (
                <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{t.motivo}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      t.puntos > 0 ? "text-[#d4aa58]" : "text-stone-400"
                    }`}
                  >
                    {t.puntos > 0 ? `+${t.puntos}` : t.puntos} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sugerencia de Encuesta si tiene visita reciente sin responder */}
        {socio.visitas.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-[#3a0b12] to-[#0d0708] rounded-2xl border border-[#5c131d]/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5c131d]/30 text-[#e18693] flex items-center justify-center shrink-0">
                <Wine className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">¿Disfrutaste tu última visita?</p>
                <p className="text-[10px] text-stone-400">Calificá tu experiencia y sumá puntos extra</p>
              </div>
            </div>
            <Link
              href={`/socio/encuesta/${socio.visitas[0].id}`}
              className="bg-[#5c131d] hover:bg-[#7a1a27] text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition shadow"
            >
              Opinar
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
