"use client";

import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Calculator,
  ShieldAlert,
  DollarSign,
} from "lucide-react";

export default function ConfiguracionManager() {
  const [pesosPorPunto, setPesosPorPunto] = useState<number>(1000);
  const [minutosValidezQR, setMinutosValidezQR] = useState<number>(15);
  const [puntosPorEncuesta, setPuntosPorEncuesta] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulador interactivo en vivo
  const [simMonto, setSimMonto] = useState<number>(60000);
  const [simComensales, setSimComensales] = useState<number>(4);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/configuracion");
      const data = await res.json();
      if (data.success) {
        setPesosPorPunto(data.config.pesosPorPunto);
        setMinutosValidezQR(data.config.minutosValidezQRCanje);
        setPuntosPorEncuesta(data.config.puntosPorEncuesta);
      } else {
        setErrorMessage(data.error || "No se pudo cargar la configuración.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar las reglas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pesosPorPunto <= 0) {
      alert("El monto en pesos por punto debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesosPorPunto,
          minutosValidezQRCanje: minutosValidezQR,
          puntosPorEncuesta,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage("¡Reglas actualizadas con éxito! Las tablets calcularán con estos valores de inmediato.");
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setErrorMessage(data.error || "No se pudo guardar la configuración.");
      }
    } catch {
      setErrorMessage("Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Cálculos del simulador
  const gastoPorPersona = simComensales > 0 ? simMonto / simComensales : 0;
  const puntosPorSocio = pesosPorPunto > 0 ? Math.floor(gastoPorPersona / pesosPorPunto) : 0;

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400 space-y-2">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#ce7281]" />
        <p className="text-xs">Cargando reglas comerciales del restaurante...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/60 border border-red-800 text-red-200 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Ratio de Conversión Pesos por Punto */}
        <div className="bg-[#0d0708] border border-[#5c131d]/35 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Conversión de Consumo a Puntos
                </h2>
                <p className="text-xs text-stone-400">
                  Define cuánto dinero facturado equivale a 1 punto de recompensa en mesa.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#d4aa58] bg-[#5c131d]/25 px-3 py-1 rounded-xl border border-[#5c131d]/40">
              ${pesosPorPunto.toLocaleString("es-AR")} = 1 pt
            </span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Monto en pesos por cada 1 punto *
            </label>
            <div className="relative max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-base">
                $
              </span>
              <input
                type="number"
                required
                min={1}
                step={50}
                value={pesosPorPunto}
                onChange={(e) => setPesosPorPunto(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full bg-[#050304] border border-stone-800 rounded-2xl pl-8 pr-4 py-3 font-mono font-bold text-lg text-[#d4aa58] focus:outline-none focus:border-[#5c131d]"
              />
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              <span className="text-[11px] text-stone-500 self-center mr-1">Valores habituales:</span>
              {[800, 1000, 1200, 1500, 2000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPesosPorPunto(v)}
                  className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold transition border ${
                    pesosPorPunto === v
                      ? "bg-[#5c131d] text-white border-[#7a1a27] shadow-sm"
                      : "bg-[#150c0e] text-stone-300 border-stone-800 hover:bg-stone-800"
                  }`}
                >
                  ${v.toLocaleString("es-AR")}
                </button>
              ))}
            </div>
          </div>

          {/* Simulador Interactivo */}
          <div className="bg-[#050304] border border-stone-800/80 rounded-2xl p-4 mt-4 space-y-3">
            <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-[#d4aa58]" />
              <span>Simulador en Tiempo Real de Mesa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Ticket de ejemplo ($):</label>
                <input
                  type="number"
                  step={1000}
                  value={simMonto}
                  onChange={(e) => setSimMonto(Math.max(1000, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#150c0e] border border-stone-800 rounded-xl px-3 py-1.5 font-mono text-white focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Comensales presentes:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={simComensales}
                  onChange={(e) => setSimComensales(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#150c0e] border border-stone-800 rounded-xl px-3 py-1.5 font-mono text-white focus:outline-none focus:border-[#5c131d]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#150c0e] rounded-xl border border-[#5c131d]/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-stone-300">
                Gasto promedio: <strong className="text-white">${Math.round(gastoPorPersona).toLocaleString("es-AR")}</strong> / persona
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400">Cada socio en mesa suma:</span>
                <span className="font-mono font-extrabold text-[#d4aa58] text-sm bg-[#5c131d]/20 px-2 py-0.5 rounded-lg border border-[#5c131d]/40">
                  {puntosPorSocio} puntos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Vigencia de Cupones QR de Premios */}
        <div className="bg-[#0d0708] border border-[#5c131d]/35 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Validez Temporal del Código QR de Premios
                </h2>
                <p className="text-xs text-stone-400">
                  Tiempo máximo para que el mozo valide el cupón en mesa antes de que expire.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#d4aa58] bg-[#5c131d]/25 px-3 py-1 rounded-xl border border-[#5c131d]/40">
              {minutosValidezQR} minutos
            </span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Minutos de vigencia del QR *
            </label>
            <input
              type="number"
              required
              min={1}
              max={180}
              value={minutosValidezQR}
              onChange={(e) => setMinutosValidezQR(Math.max(1, parseInt(e.target.value) || 1))}
              className="max-w-sm w-full bg-[#050304] border border-stone-800 rounded-2xl px-4 py-3 font-mono font-bold text-lg text-[#d4aa58] focus:outline-none focus:border-[#5c131d]"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[10, 15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutosValidezQR(m)}
                  className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold transition border ${
                    minutosValidezQR === m
                      ? "bg-[#5c131d] text-white border-[#7a1a27] shadow-sm"
                      : "bg-[#150c0e] text-stone-300 border-stone-800 hover:bg-stone-800"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>

            <p className="text-[11px] text-stone-400 mt-3 flex items-start gap-1.5 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-[#ce7281] shrink-0 mt-0.5" />
              <span>
                <strong>Medida antifraude:</strong> El límite de 15 minutos garantiza que el cliente no pueda guardar capturas de pantalla de un cupón y reutilizarlo en visitas posteriores. Si transcurre el tiempo sin validarse, los puntos son reintegrados automáticamente al socio.
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Puntos de Recompensa por Encuesta */}
        <div className="bg-[#0d0708] border border-[#5c131d]/35 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-[#d4aa58]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Bonificación por Encuesta de Satisfacción
                </h2>
                <p className="text-xs text-stone-400">
                  Puntos directos acreditados al socio cuando califica su experiencia gastronómica.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#d4aa58] bg-[#5c131d]/25 px-3 py-1 rounded-xl border border-[#5c131d]/40">
              +{puntosPorEncuesta} pts
            </span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Puntos otorgados al completar *
            </label>
            <input
              type="number"
              min={0}
              value={puntosPorEncuesta}
              onChange={(e) => setPuntosPorEncuesta(Math.max(0, parseInt(e.target.value) || 0))}
              className="max-w-sm w-full bg-[#050304] border border-stone-800 rounded-2xl px-4 py-3 font-mono font-bold text-lg text-[#d4aa58] focus:outline-none focus:border-[#5c131d]"
            />

            <div className="flex flex-wrap gap-2 mt-2.5">
              {[0, 10, 20, 30, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPuntosPorEncuesta(p)}
                  className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold transition border ${
                    puntosPorEncuesta === p
                      ? "bg-[#5c131d] text-white border-[#7a1a27] shadow-sm"
                      : "bg-[#150c0e] text-stone-300 border-stone-800 hover:bg-stone-800"
                  }`}
                >
                  {p === 0 ? "Sin bonificación (0)" : `+${p} pts`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#5c131d] hover:bg-[#7a1a27] disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? "Guardando cambios..." : "Guardar Reglas del Restaurante"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}