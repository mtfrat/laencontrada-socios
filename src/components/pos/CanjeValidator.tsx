"use client";

import { useState, useRef } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gift,
  UserCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";

interface ValidacionResult {
  id: string;
  codigoQR: string;
  premio: string;
  puntosDebitado: number;
  socio: {
    nombre: string;
    dni: string;
    nuevoSaldo: number;
  };
  fechaCanje: string;
  validadoPor: string;
}

export default function CanjeValidator() {
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState<ValidacionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setErrorMessage("Por favor ingresa o escanea el código del cupón.");
      return;
    }

    setValidando(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/pos/canje/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setResultado(data.canje);
        setCodigo("");
      } else {
        setErrorMessage(data.error || "No se pudo validar el cupón.");
      }
    } catch {
      setErrorMessage("Error de conexión al validar el cupón.");
    } finally {
      setValidando(false);
    }
  };

  const handleReset = () => {
    setResultado(null);
    setCodigo("");
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Validador de Cupones QR</h2>
          <p className="text-xs text-stone-400">
            Escanea o tipea el código de 6-8 caracteres que presenta el socio en su pantalla.
          </p>
        </div>
      </div>

      {/* Pantalla de Éxito al Validar */}
      {resultado ? (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ¡Canje Aprobado!
            </span>
            <h3 className="text-2xl font-bold text-white pt-2">
              Entregar: {resultado.premio}
            </h3>
            <p className="text-xs text-stone-300">
              Se debitaron{" "}
              <span className="font-mono font-bold text-amber-400">
                {resultado.puntosDebitado} puntos
              </span>{" "}
              correctamente.
            </p>
          </div>

          <div className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 text-xs text-stone-300 space-y-2 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-stone-400">Socio Titular:</span>
              <span className="font-semibold text-white">{resultado.socio.nombre}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-stone-400">DNI:</span>
              <span className="font-mono font-semibold text-stone-200">{resultado.socio.dni}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-stone-400">Código Validado:</span>
              <span className="font-mono font-bold text-amber-400">{resultado.codigoQR}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Nuevo Saldo del Socio:</span>
              <span className="font-mono font-bold text-emerald-400">
                {resultado.socio.nuevoSaldo} pts
              </span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Validar otro cupón</span>
          </button>
        </div>
      ) : (
        /* Formulario de Entrada */
        <form onSubmit={handleValidar} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-950/60 border border-red-800/80 text-red-200 p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Atención: </span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              Código Alfanumérico o Escáner QR
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EJ: CANJE-8F2B9M o 8F2B9M"
                autoFocus
                className="w-full bg-stone-950 border-2 border-stone-700 focus:border-amber-500 rounded-2xl px-4 py-4 text-center font-mono font-extrabold text-2xl text-amber-300 tracking-wider placeholder-stone-700 outline-none uppercase shadow-inner"
              />
              {codigo && (
                <button
                  type="button"
                  onClick={() => setCodigo("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-2 text-center">
              Puedes ingresar el código completo con el prefijo "CANJE-" o únicamente los caracteres finales.
            </p>
          </div>

          <button
            type="submit"
            disabled={validando || !codigo.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            {validando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>{validando ? "Validando cupón..." : "Validar y Entregar Premio"}</span>
          </button>
        </form>
      )}
    </div>
  );
}