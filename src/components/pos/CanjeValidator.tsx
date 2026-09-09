"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  X,
  Camera,
  CameraOff,
  Keyboard,
  Sparkles,
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
  const [cameraActiva, setCameraActiva] = useState(false);
  const [iniciandoCamara, setIniciandoCamara] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const procesarValidacion = useCallback(async (codigoAValidar: string) => {
    if (!codigoAValidar || !codigoAValidar.trim()) {
      setErrorMessage("Por favor ingresa o escanea el código del cupón.");
      return;
    }

    setValidando(true);
    setErrorMessage(null);
    setCameraError(null);

    try {
      const res = await fetch("/api/pos/canje/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoAValidar.trim() }),
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
  }, []);

  const handleValidarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procesarValidacion(codigo);
  };

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error deteniendo cámara:", err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActiva(false);
    setIniciandoCamara(false);
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    setCameraError(null);
    setIniciandoCamara(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      setCameraActiva(true);

      // Pequeño timeout para permitir que el elemento #qr-reader-target se monte en el DOM
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("qr-reader-target");
          html5QrCodeRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              aspectRatio: 1.0,
            },
            async (decodedText: string) => {
              if (typeof window !== "undefined" && window.navigator && "vibrate" in window.navigator) {
                try {
                  window.navigator.vibrate(120);
                } catch {
                  // Silencioso
                }
              }

              // Detener cámara inmediatamente al detectar código
              await stopCamera();

              // Validar código capturado
              setCodigo(decodedText);
              await procesarValidacion(decodedText);
            },
            () => {
              // Frame sin QR: continuar escaneando
            }
          );
          setIniciandoCamara(false);
        } catch (err: any) {
          console.error("Error inicializando Html5Qrcode:", err);
          setCameraError(
            "No se pudo acceder a la cámara. Asegúrate de conceder permisos al navegador o escribe el código manualmente."
          );
          setCameraActiva(false);
          setIniciandoCamara(false);
        }
      }, 150);
    } catch (err: any) {
      console.error("Error importando html5-qrcode:", err);
      setCameraError("El escáner no es compatible con este navegador.");
      setCameraActiva(false);
      setIniciandoCamara(false);
    }
  };

  // Limpiar cámara si el componente se desmonta
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear().catch(() => {});
        } catch {
          // Silencioso
        }
      }
    };
  }, []);

  const handleReset = () => {
    setResultado(null);
    setCodigo("");
    setErrorMessage(null);
    setCameraError(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="bg-[#0d0708] border border-[#5c131d]/35 rounded-3xl p-6 shadow-2xl max-w-xl mx-auto space-y-5">
      {/* Header con indicador de modo */}
      <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5c131d]/25 text-[#d4aa58] border border-[#5c131d]/40 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Validador de Cupones QR</h2>
            <p className="text-xs text-[#f5ede6]/50">
              Escaneo en vivo por cámara o ingreso manual de código
            </p>
          </div>
        </div>

        {!resultado && (
          <div>
            {cameraActiva ? (
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-xl bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/70 hover:text-white border border-[#5c131d]/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Keyboard className="w-3.5 h-3.5 text-[#d4aa58]" />
                <span>Usar Teclado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={iniciandoCamara}
                className="px-3 py-1.5 rounded-xl bg-[#5c131d] hover:bg-[#731925] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#5c131d]/30 transition"
              >
                {iniciandoCamara ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-[#d4aa58]" />
                )}
                <span>Activar Cámara</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pantalla de Éxito al Validar */}
      {resultado ? (
        <div className="bg-[#150c0e] border border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ¡Canje Aprobado!
            </span>
            <h3 className="text-2xl font-bold text-white pt-2 font-serif">
              Entregar: {resultado.premio}
            </h3>
            <p className="text-xs text-[#f5ede6]/70">
              Se debitaron{" "}
              <span className="font-mono font-bold text-[#d4aa58]">
                {resultado.puntosDebitado} puntos
              </span>{" "}
              correctamente.
            </p>
          </div>

          <div className="bg-[#050304] rounded-2xl p-4 border border-[#5c131d]/25 text-xs text-[#f5ede6]/80 space-y-2 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[#5c131d]/15">
              <span className="text-[#f5ede6]/50">Socio Titular:</span>
              <span className="font-semibold text-white">{resultado.socio.nombre}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#5c131d]/15">
              <span className="text-[#f5ede6]/50">DNI:</span>
              <span className="font-mono font-semibold text-[#f5ede6]">{resultado.socio.dni}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#5c131d]/15">
              <span className="text-[#f5ede6]/50">Código Validado:</span>
              <span className="font-mono font-bold text-[#d4aa58]">{resultado.codigoQR}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#f5ede6]/50">Nuevo Saldo del Socio:</span>
              <span className="font-mono font-bold text-[#d4aa58]">
                {resultado.socio.nuevoSaldo} pts
              </span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-[#5c131d] hover:bg-[#731925] text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#5c131d]/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Validar otro cupón</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Alertas de Error */}
          {errorMessage && (
            <div className="bg-[#3a0b12]/70 border border-red-800/80 text-red-200 p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
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

          {cameraError && (
            <div className="bg-[#3a0b12]/70 border border-red-800/80 text-red-200 p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <CameraOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCameraError(null)}
                className="text-red-400 hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* MODO 1: CÁMARA EN VIVO */}
          {cameraActiva ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative bg-[#010101] border-2 border-[#5c131d]/60 rounded-3xl overflow-hidden p-2 shadow-2xl">
                {/* Target Container para html5-qrcode */}
                <div id="qr-reader-target" className="w-full rounded-2xl overflow-hidden min-h-[280px]" />

                {iniciandoCamara && (
                  <div className="absolute inset-0 bg-[#010101]/90 flex flex-col items-center justify-center gap-2.5 text-[#f5ede6]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#d4aa58]" />
                    <p className="text-xs font-semibold">Iniciando cámara de la tablet...</p>
                  </div>
                )}

                {validando && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 text-white">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5c131d]" />
                    <p className="text-sm font-bold">Validando cupón detectado...</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-[#f5ede6]/60">
                  Apunta la cámara de la tablet al <strong className="text-white">código QR</strong> en la pantalla del socio.
                </p>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/70 hover:text-white border border-[#5c131d]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar Escáner</span>
                </button>
              </div>
            </div>
          ) : (
            /* MODO 2: ENTRADA MANUAL O CON TECLADO */
            <form onSubmit={handleValidarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f5ede6]/80 mb-2 flex items-center justify-between">
                  <span>Código Alfanumérico del Cupón</span>
                  <span className="text-[10px] text-[#f5ede6]/40 font-normal">
                    O pulsa &quot;Activar Cámara&quot; arriba
                  </span>
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="EJ: CANJE-8F2B9M o 8F2B9M"
                    autoFocus
                    className="w-full bg-[#050304] border-2 border-[#5c131d]/30 focus:border-[#5c131d] rounded-2xl px-4 py-4 text-center font-mono font-extrabold text-2xl text-[#d4aa58] tracking-wider placeholder-[#f5ede6]/20 outline-none uppercase shadow-inner transition"
                  />
                  {codigo && (
                    <button
                      type="button"
                      onClick={() => setCodigo("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#f5ede6]/40 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#f5ede6]/40 mt-2 text-center">
                  Puedes ingresar el código completo con el prefijo &quot;CANJE-&quot; o únicamente los caracteres finales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-3.5 bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6] font-bold rounded-2xl text-sm border border-[#5c131d]/40 transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Camera className="w-4 h-4 text-[#d4aa58]" />
                  <span>Escanear QR con Cámara</span>
                </button>

                <button
                  type="submit"
                  disabled={validando || !codigo.trim()}
                  className="py-3.5 bg-[#5c131d] hover:bg-[#731925] disabled:opacity-40 text-white font-bold rounded-2xl text-sm shadow-xl shadow-[#5c131d]/30 transition flex items-center justify-center gap-2"
                >
                  {validando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{validando ? "Validando..." : "Validar Cupón"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}