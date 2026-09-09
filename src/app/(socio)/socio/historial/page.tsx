import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Clock, ArrowLeft, UtensilsCrossed, Sparkles, MessageSquare } from "lucide-react";

export default async function SocioHistorialPage() {
  const session = await getSocioSession();

  if (!session) {
    redirect("/socio/login");
  }

  // Traer historial completo de transacciones y visitas del socio
  const [transacciones, visitas] = await Promise.all([
    prisma.transaccionPuntos.findMany({
      where: { socioId: session.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.visitaConsumo.findMany({
      where: { socioId: session.id },
      include: {
        platos: true,
        respuestaEncuesta: true,
      },
      orderBy: { fechaVisita: "desc" },
    }),
  ]);

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
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Tu Historial de Experiencias
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Registro detallado de tus consumos en el bistró, platos disfrutados y puntos ganados.
          </p>
        </div>

        {/* Visitas Detalladas con Encuestas Disponibles */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-[#ce7281]" />
            Mesas y Visitas Gastronómicas ({visitas.length})
          </h2>

          {visitas.length === 0 ? (
            <div className="bg-[#0d0708] p-6 rounded-3xl border border-stone-800 text-center text-xs text-stone-500">
              Todavía no registras visitas a mesas en el bistró.
            </div>
          ) : (
            visitas.map((v) => {
              const pendienteEncuesta = !v.respuestaEncuesta;
              return (
                <div
                  key={v.id}
                  className="bg-[#0d0708] rounded-3xl p-5 border border-[#5c131d]/30 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-[#5c131d]/20 text-[#f5ede6] border border-[#5c131d]/40 px-2 py-0.5 rounded-md font-semibold">
                        Turno {v.franjaHoraria}
                      </span>
                      <p className="text-xs text-stone-400 mt-1 capitalize">
                        {new Date(v.fechaVisita).toLocaleDateString("es-AR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-[#d4aa58] block">
                        +{v.puntosAcreditados} pts
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {v.cantidadComensales} comensales
                      </span>
                    </div>
                  </div>

                  {/* Platos consumidos */}
                  {v.platos.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80">
                      <p className="text-[11px] font-medium text-stone-400 mb-1.5">
                        Platos disfrutados:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.platos.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-[#150c0e] text-[#f5ede6] border border-[#5c131d]/30 px-2.5 py-1 rounded-lg"
                          >
                            <span className="font-bold text-[#e18693]">{p.cantidad}x</span> {p.nombrePlato}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón de Encuesta si no la completó */}
                  {pendienteEncuesta && (
                    <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-[#ce7281] font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4aa58]" />
                        ¿Qué te pareció la visita?
                      </span>
                      <Link
                        href={`/socio/encuesta/${v.id}`}
                        className="text-xs bg-[#5c131d] hover:bg-[#7a1a27] text-white font-semibold px-3 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Calificar y Sumar
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Libro Mayor de Transacciones */}
        <div className="bg-[#0d0708] rounded-3xl p-5 border border-stone-800/80 shadow-lg space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 pb-2.5 border-b border-stone-800/80">
            <Clock className="w-3.5 h-3.5 text-[#ce7281]" />
            Movimientos de la Cuenta
          </h2>

          <div className="divide-y divide-stone-800/60">
            {transacciones.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-white">{tx.motivo}</p>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(tx.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  className={`font-mono font-bold text-sm ${
                    tx.puntos >= 0 ? "text-[#d4aa58]" : "text-[#e18693]"
                  }`}
                >
                  {tx.puntos > 0 ? `+${tx.puntos}` : tx.puntos} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
