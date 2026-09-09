import { redirect } from "next/navigation";
import Link from "next/link";
import { getSocioSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Clock, ArrowLeft, UtensilsCrossed, Sparkles, MessageSquare, Award } from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Tu Historial de Experiencias
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro detallado de tus consumos, platos disfrutados y puntos ganados.
          </p>
        </div>

        {/* Visitas Detalladas con Encuestas Disponibles */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-amber-800" />
            Mesas y Visitas Gastron�micas ({visitas.length})
          </h2>

          {visitas.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-amber-200/60 text-center text-xs text-stone-400">
              Todav�a no registras visitas a mesas.
            </div>
          ) : (
            visitas.map((v) => {
              const pendienteEncuesta = !v.respuestaEncuesta;
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                        Turno {v.franjaHoraria}
                      </span>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(v.fechaVisita).toLocaleDateString("es-AR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-emerald-700 block">
                        +{v.puntosAcreditados} pts
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {v.cantidadComensales} comensales
                      </span>
                    </div>
                  </div>

                  {/* Platos consumidos */}
                  {v.platos.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-[11px] font-medium text-stone-600 mb-1">
                        Platos disfrutados:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {v.platos.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200/70 px-2 py-0.5 rounded-md"
                          >
                            <span className="font-bold">{p.cantidad}x</span> {p.nombrePlato}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bot�n de Encuesta si no la complet� */}
                  {pendienteEncuesta && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        �Qu� te pareci� la visita?
                      </span>
                      <Link
                        href={`/socio/encuesta/${v.id}`}
                        className="text-xs bg-amber-800 hover:bg-amber-900 text-white font-semibold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Calificar y Sumar Puntos
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Libro Mayor de Transacciones */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <Clock className="w-3.5 h-3.5 text-amber-800" />
            Movimientos de la Cuenta
          </h2>

          <div className="divide-y divide-stone-100">
            {transacciones.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-stone-900">{tx.motivo}</p>
                  <span className="text-[10px] text-stone-400">
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
                    tx.puntos >= 0 ? "text-emerald-700" : "text-red-600"
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
