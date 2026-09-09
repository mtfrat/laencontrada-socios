"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Utensils,
  MessageSquare,
} from "lucide-react";

interface PreguntaItem {
  id: string;
  texto: string;
  categoria: string | null;
}

export default function SocioEncuestaPage() {
  const params = useParams();
  const router = useRouter();
  const visitaId = params.visitaId as string;

  const [loading, setLoading] = useState(true);
  const [preguntas, setPreguntas] = useState<PreguntaItem[]>([]);
  const [puntosRecompensa, setPuntosRecompensa] = useState(10);
  const [yaRespondida, setYaRespondida] = useState(false);

  // Calificaciones por preguntaId (1 a 5, por defecto 5)
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchEncuesta = async () => {
      try {
        const res = await fetch(`/api/socio/encuesta/${visitaId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "No pudimos cargar la encuesta.");
          setLoading(false);
          return;
        }

        if (data.yaRespondida) {
          setYaRespondida(true);
          setLoading(false);
          return;
        }

        setPreguntas(data.preguntas);
        setPuntosRecompensa(data.puntosPorEncuesta);

        // Inicializar todas las preguntas con 5 estrellas
        const initRatings: Record<string, number> = {};
        data.preguntas.forEach((p: PreguntaItem) => {
          initRatings[p.id] = 5;
        });
        setRatings(initRatings);
      } catch {
        setError("Error de conexi�n al cargar la encuesta.");
      } finally {
        setLoading(false);
      }
    };

    fetchEncuesta();
  }, [visitaId]);

  const handleRatingChange = (preguntaId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [preguntaId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      respuestas: Object.entries(ratings).map(([preguntaId, puntuacion]) => ({
        preguntaId,
        puntuacion,
      })),
      comentarios,
    };

    try {
      const res = await fetch(`/api/socio/encuesta/${visitaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al enviar la calificaci�n.");
        setSubmitting(false);
        return;
      }

      setCompleted(true);
    } catch {
      setError("Error de red al enviar tus respuestas.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] flex flex-col items-center justify-center p-6 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-800 mb-3" />
        <p className="text-sm">Cargando encuesta...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] flex flex-col justify-between p-6 max-w-md mx-auto">
        <div className="my-auto text-center bg-white p-8 rounded-3xl border border-amber-200 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-amber-950">
            �Muchas Gracias por tu Opini�n!
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            Tus comentarios nos ayudan a superarnos cada d�a en La Encontrada.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">
              Premio acreditado:
            </span>
            <span className="text-3xl font-extrabold font-mono text-amber-900 mt-1 block">
              +{puntosRecompensa} puntos
            </span>
            <span className="text-[11px] text-amber-800/80">
              Ya est�n disponibles en tu saldo para canjear por premios.
            </span>
          </div>

          <Link
            href="/socio/dashboard"
            className="w-full block py-3.5 px-6 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-2xl shadow transition"
          >
            Volver a Mi Cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (yaRespondida) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] flex flex-col justify-between p-6 max-w-md mx-auto">
        <div className="my-auto text-center bg-white p-8 rounded-3xl border border-amber-200 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-stone-900">Esta visita ya fue evaluada</h2>
          <p className="text-stone-500 text-xs mt-2 mb-6">
            Ya recibiste tus puntos de bonificaci�n por esta visita. �Gracias por participar!
          </p>
          <Link
            href="/socio/dashboard"
            className="inline-block py-2.5 px-5 bg-amber-800 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7f0] text-stone-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-amber-200/60 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/socio/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium py-1 px-2.5 rounded-lg bg-stone-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </Link>
          <span className="text-xs font-serif font-bold text-amber-950">LA ENCONTRADA</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* Banner Recompensa */}
        <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 text-white p-5 rounded-3xl shadow-lg border border-amber-700/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Encuesta de Satisfacci�n</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white">�C�mo estuvo tu experiencia?</h1>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Respond� en 1 minuto y sum� <span className="font-bold font-mono text-amber-300">+{puntosRecompensa} pts</span> de regalo.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {preguntas.map((p, idx) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-5 border border-amber-200/60 shadow-sm space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <h2 className="text-sm font-semibold text-stone-800 leading-snug">
                  {p.texto}
                </h2>
              </div>

              {/* Star Rating Selector */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentRating = ratings[p.id] || 5;
                  const isSelected = star <= currentRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(p.id, star)}
                      className="p-1 rounded-xl focus:outline-none transition transform active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition ${
                          isSelected
                            ? "text-amber-500 fill-amber-400 drop-shadow-sm"
                            : "text-stone-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-stone-400 px-2 font-medium">
                <span>Regular</span>
                <span>Excelente</span>
              </div>
            </div>
          ))}

          {/* Comentarios Adicionales */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
              Sugerencias o comentarios (Opcional):
            </label>
            <textarea
              rows={3}
              placeholder="Contanos qu� fue lo que m�s te gust� o qu� podemos mejorar..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700 transition resize-none"
            />
          </div>

          {/* Bot�n de Env�o */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-amber-800 hover:bg-amber-900 disabled:bg-amber-700/60 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando y acreditando puntos...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                Enviar y Sumar +{puntosRecompensa} Puntos
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
