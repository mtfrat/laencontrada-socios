import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, Medal, ArrowLeft, Sparkles, Award } from "lucide-react";

export default async function SocioRankingPage() {
  const session = await getSocioSession();

  if (!session) {
    redirect("/socio/login");
  }

  // Obtener Top 20 socios por puntos históricos
  const topSocios = await prisma.socio.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      numeroSocio: true,
      puntosHistoricos: true,
      puntosActuales: true,
    },
    orderBy: { puntosHistoricos: "desc" },
    take: 20,
  });

  // Socio conectado
  const socioActual = await prisma.socio.findUnique({
    where: { id: session.id },
    select: { id: true, puntosHistoricos: true, nombre: true },
  });

  let miPuesto = 1;
  if (socioActual) {
    const porDelante = await prisma.socio.count({
      where: {
        activo: true,
        puntosHistoricos: { gt: socioActual.puntosHistoricos },
      },
    });
    miPuesto = porDelante + 1;
  }

  const top3 = topSocios.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link
            href="/socio/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white font-medium py-1.5 px-3 rounded-xl bg-stone-900 border border-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a mi tarjeta
          </Link>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="drop-shadow-[0_1px_6px_rgba(92,19,29,0.5)]"
            />
            <span className="text-xs font-serif font-bold text-white tracking-wide">
              LA ENCONTRADA
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Banner Gamificación */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5c131d] via-[#3a0b12] to-[#0d0406] text-white p-6 shadow-2xl border border-[#5c131d]/50 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#d4aa58] border border-white/15 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Ranking de Fidelidad
          </h1>
          <p className="text-xs text-[#ce7281] mt-1">
            Los comensales más habituales y apasionados de La Encontrada.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-black/50 border border-[#5c131d]/60 px-4 py-1.5 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#d4aa58]" />
            <span className="text-stone-300">Tu posición actual:</span>
            <span className="font-mono font-bold text-[#d4aa58]">Puesto #{miPuesto}</span>
          </div>
        </div>

        {/* PODIO TOP 3 */}
        {top3.length > 0 && (
          <div className="bg-[#0d0708] rounded-3xl p-5 border border-[#5c131d]/30 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 text-center mb-4">
              Líderes de la Casa
            </h2>
            <div className="grid grid-cols-3 gap-2 items-end pt-2 pb-1 text-center">
              {/* #2 Puesto (Plata) */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-600 text-slate-300 flex items-center justify-center font-bold font-mono text-sm mb-2 shadow-sm">
                    2°
                  </div>
                  <p className="text-xs font-bold text-stone-200 truncate w-full">
                    {top3[1].nombre} {top3[1].apellido ? `${top3[1].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-[11px] font-mono text-stone-400 font-semibold">
                    {top3[1].puntosHistoricos} pts
                  </span>
                </div>
              )}

              {/* #1 Puesto (Oro) */}
              {top3[0] && (
                <div className="flex flex-col items-center -mt-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4aa58] to-[#997732] border border-[#d4aa58]/80 text-[#010101] flex items-center justify-center font-extrabold font-mono text-base mb-2 shadow-lg">
                      1°
                    </div>
                    <Medal className="w-5 h-5 text-[#d4aa58] absolute -top-2.5 -right-2 drop-shadow" />
                  </div>
                  <p className="text-xs font-bold text-white truncate w-full">
                    {top3[0].nombre} {top3[0].apellido ? `${top3[0].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-xs font-mono text-[#d4aa58] font-extrabold">
                    {top3[0].puntosHistoricos} pts
                  </span>
                </div>
              )}

              {/* #3 Puesto (Bronce) */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#5c131d]/30 border border-[#5c131d]/50 text-[#ce7281] flex items-center justify-center font-bold font-mono text-sm mb-2 shadow-sm">
                    3°
                  </div>
                  <p className="text-xs font-bold text-stone-200 truncate w-full">
                    {top3[2].nombre} {top3[2].apellido ? `${top3[2].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-[11px] font-mono text-stone-400 font-semibold">
                    {top3[2].puntosHistoricos} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla Completa del Ranking */}
        <div className="bg-[#0d0708] rounded-3xl p-5 border border-stone-800/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Tabla General (Top 20)
            </h2>
            <span className="text-[11px] text-stone-500 font-mono">Puntos Históricos</span>
          </div>

          <div className="divide-y divide-stone-800/60">
            {topSocios.map((s, idx) => {
              const puesto = idx + 1;
              const isMe = s.id === session.id;
              const inicialApellido = s.apellido ? ` ${s.apellido.charAt(0)}.` : "";

              return (
                <div
                  key={s.id}
                  className={`py-3 px-3 rounded-2xl flex items-center justify-between transition ${
                    isMe
                      ? "bg-[#5c131d]/20 border border-[#5c131d]/60 font-bold"
                      : "hover:bg-stone-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center ${
                        puesto === 1
                          ? "bg-[#d4aa58] text-stone-950 font-extrabold"
                          : puesto === 2
                          ? "bg-slate-700 text-slate-200"
                          : puesto === 3
                          ? "bg-[#5c131d]/50 text-[#f5ede6] border border-[#5c131d]/60"
                          : "bg-stone-900 text-stone-400 border border-stone-800"
                      }`}
                    >
                      {puesto}
                    </span>
                    <div>
                      <p className="text-xs text-white flex items-center gap-1.5">
                        <span>
                          {s.nombre}
                          {inicialApellido}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-[#5c131d] text-white px-2 py-0.5 rounded-full font-sans font-semibold">
                            Vos
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Socio {s.numeroSocio}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs font-bold text-[#d4aa58]">
                    {s.puntosHistoricos.toLocaleString("es-AR")} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nota de Privacidad y Gamificación */}
        <div className="bg-[#150c0e] rounded-2xl p-4 border border-[#5c131d]/30 text-xs text-stone-300 leading-relaxed space-y-1">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#ce7281]" />
            Privacidad & Reconocimiento
          </p>
          <p className="text-stone-400">
            Para proteger tu privacidad, los apellidos se muestran únicamente con su inicial. Los puntos históricos reflejan todas las visitas acumuladas sin descontarse al canjear premios.
          </p>
        </div>
      </main>
    </div>
  );
}
