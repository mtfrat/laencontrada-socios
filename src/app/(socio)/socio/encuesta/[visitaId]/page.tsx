"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

        const initRatings: Record<string, number> = {};
        data.preguntas.forEach((p: PreguntaItem) => {
          initRatings[p.id] = 5;
        });
        setRatings(initRatings);
      } catch {
        setError("Error de conexión al cargar la encuesta.");
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
        setError(data.error || "Error al enviar la calificación.");
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
      <div className="min-h-screen bg-[#010101] flex flex-col items-center justify-center p-6 text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#ce7281] mb-3" />
        <p className="text-sm">Cargando encuesta...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#010101] flex flex-col justify-between p-6 max-w-md mx-auto text-stone-100">
        <div className="my-auto text-center bg-[#0d0708] p-8 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-white">
            ¡Muchas Gracias por tu Opinión!
          </h2>
          <p className="text-stone-300 text-sm">
            Tus comentarios nos ayudan a superarnos cada día en La Encontrada.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-[#150c0e] border border-[#5c131d]/40">
            <span className="text-xs text-[#ce7281] font-semibold uppercase tracking-wider block">
              Premio acreditado:
            </span>
            <span className="text-3xl font-extrabold font-mono text-[#d4aa58] mt-1 block">
              +{puntosRecompensa} puntos
            </span>
            <span className="text-[11px] text-stone-400">
              Ya están disponibles en tu saldo para canjear por premios.
            </span>
          </div>

          <Link
            href="/socio/dashboard"
            className="w-full block py-3.5 px-6 bg-[#5c131d] hover:bg-[#7a1a27] text-white font-semibold rounded-2xl shadow-lg transition"
          >
            Volver a Mi Cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (yaRespondida) {
    return (
      <div className="min-h-screen bg-[#010101] flex flex-col justify-between p-6 max-w-md mx-auto text-stone-100">
        <div className="my-auto text-center bg-[#0d0708] p-8 rounded-3xl border border-stone-800 shadow-xl space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Esta visita ya fue evaluada</h2>
          <p className="text-stone-400 text-xs">
            Ya recibiste tus puntos de bonificación por esta visita. ¡Gracias por participar!
          </p>
          <div className="pt-3">
            <Link
              href="/socio/dashboard"
              className="inline-block py-2.5 px-5 bg-[#5c131d] hover:bg-[#7a1a27] text-white text-xs font-semibold rounded-xl shadow transition"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-12">
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link
            href="/socio/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white font-medium py-1.5 px-3 rounded-xl bg-stone-900 border border-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
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

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5c131d] via-[#3a0b12] to-[#0d0406] text-white p-5 shadow-2xl border border-[#5c131d]/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4aa58]" />
              <span>Encuesta de Satisfacción</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white">¿Cómo estuvo tu experiencia?</h1>
            <p className="text-xs text-stone-300 mt-0.5">
              Respondé en 1 minuto y sumá <span className="font-bold font-mono text-[#d4aa58]">+{puntosRecompensa} pts</span> de regalo.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {preguntas.map((p, idx) => (
            <div
              key={p.id}
              className="bg-[#0d0708] rounded-2xl p-5 border border-[#5c131d]/30 shadow-lg space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#5c131d]/30 text-[#ce7281] border border-[#5c131d]/40 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <h2 className="text-sm font-semibold text-white leading-snug">
                  {p.texto}
                </h2>
              </div>

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
                            ? "text-[#d4aa58] fill-[#d4aa58] drop-shadow-[0_2px_8px_rgba(212,170,88,0.4)]"
                            : "text-stone-700 hover:text-stone-500"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-stone-500 px-2 font-medium">
                <span>Regular</span>
                <span>Excelente</span>
              </div>
            </div>
          ))}

          <div className="bg-[#0d0708] rounded-2xl p-4 border border-stone-800 shadow-lg space-y-2">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#ce7281]" />
              Sugerencias o comentarios (Opcional):
            </label>
            <textarea
              rows={3}
              placeholder="Contanos qué fue lo que más te gustó o qué podemos mejorar..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full p-3 bg-[#050304] border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#5c131d] transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-[#5c131d] hover:bg-[#7a1a27] disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando y acreditando puntos...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#d4aa58]" />
                Enviar y Sumar +{puntosRecompensa} Puntos
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
