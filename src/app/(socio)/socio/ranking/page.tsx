import { redirect } from "next/navigation";
import Link from "next/link";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, Medal, ArrowLeft, Sparkles, Award } from "lucide-react";

export default async function SocioRankingPage() {
  const session = await getSocioSession();

  if (!session) {
    redirect("/socio/login");
  }

  // Obtener Top 20 socios por puntos hist�ricos
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
    <div className="min-h-screen bg-[#fbf7f0] text-stone-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-amber-200/60 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/socio/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium py-1 px-2.5 rounded-lg bg-stone-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a mi tarjeta
          </Link>
          <span className="text-xs font-serif font-bold text-amber-950">LA ENCONTRADA</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 text-white p-6 rounded-3xl shadow-lg border border-amber-700/50 text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Ranking de Fidelidad
          </h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Los comensales m�s habituales y apasionados de La Encontrada.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-amber-950/80 border border-amber-700/60 px-4 py-1.5 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tu posici�n actual:</span>
            <span className="font-mono font-bold text-amber-300">Puesto #{miPuesto}</span>
          </div>
        </div>

        {/* PODIO TOP 3 (Visual Gamification) */}
        {top3.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 text-center mb-4">
              L�deres de la Casa
            </h2>
            <div className="grid grid-cols-3 gap-2 items-end pt-2 pb-1 text-center">
              {/* #2 Puesto (Plata) */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-bold font-mono text-sm mb-2 shadow-sm">
                    2�
                  </div>
                  <p className="text-xs font-bold text-stone-800 truncate w-full">
                    {top3[1].nombre} {top3[1].apellido ? `${top3[1].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-[11px] font-mono text-stone-500 font-semibold">
                    {top3[1].puntosHistoricos} pts
                  </span>
                </div>
              )}

              {/* #1 Puesto (Oro) */}
              {top3[0] && (
                <div className="flex flex-col items-center -mt-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 border border-amber-500 text-amber-950 flex items-center justify-center font-extrabold font-mono text-base mb-2 shadow-md">
                      1�
                    </div>
                    <Medal className="w-5 h-5 text-amber-600 absolute -top-2.5 -right-2" />
                  </div>
                  <p className="text-xs font-bold text-amber-950 truncate w-full">
                    {top3[0].nombre} {top3[0].apellido ? `${top3[0].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-xs font-mono text-amber-800 font-extrabold">
                    {top3[0].puntosHistoricos} pts
                  </span>
                </div>
              )}

              {/* #3 Puesto (Bronce) */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-amber-800/10 border border-amber-700/30 text-amber-800 flex items-center justify-center font-bold font-mono text-sm mb-2 shadow-sm">
                    3�
                  </div>
                  <p className="text-xs font-bold text-stone-800 truncate w-full">
                    {top3[2].nombre} {top3[2].apellido ? `${top3[2].apellido.charAt(0)}.` : ""}
                  </p>
                  <span className="text-[11px] font-mono text-stone-500 font-semibold">
                    {top3[2].puntosHistoricos} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla Completa del Ranking */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Tabla General (Top 20)
            </h2>
            <span className="text-[11px] text-stone-400">Puntos Hist�ricos</span>
          </div>

          <div className="divide-y divide-stone-100">
            {topSocios.map((s, idx) => {
              const puesto = idx + 1;
              const isMe = s.id === session.id;
              const inicialApellido = s.apellido ? ` ${s.apellido.charAt(0)}.` : "";

              return (
                <div
                  key={s.id}
                  className={`py-3 px-3 rounded-2xl flex items-center justify-between transition ${
                    isMe
                      ? "bg-amber-100/70 border border-amber-300 font-bold"
                      : "hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center ${
                        puesto === 1
                          ? "bg-amber-400 text-amber-950"
                          : puesto === 2
                          ? "bg-slate-200 text-slate-800"
                          : puesto === 3
                          ? "bg-amber-100 text-amber-900"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {puesto}
                    </span>
                    <div>
                      <p className="text-xs text-stone-900 flex items-center gap-1.5">
                        <span>
                          {s.nombre}
                          {inicialApellido}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded-full font-sans font-semibold">
                            Vos
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Socio {s.numeroSocio}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs font-bold text-stone-800">
                    {s.puntosHistoricos.toLocaleString("es-AR")} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nota de Privacidad y Gamificaci�n */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-800" />
            Privacidad & Reconocimiento
          </p>
          <p className="text-amber-800/80">
            Para proteger tu privacidad, los apellidos se muestran �nicamente con su inicial. Los puntos hist�ricos reflejan todas las visitas acumuladas sin descontarse al canjear premios.
          </p>
        </div>
      </main>
    </div>
  );
}
