"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Gift,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
  QrCode,
  XCircle,
  RotateCcw,
} from "lucide-react";

interface CanjeDetalle {
  id: string;
  codigoQR: string;
  estado: "PENDIENTE" | "COMPLETADO" | "EXPIRADO" | "CANCELADO";
  puntosGastados: number;
  fechaExpiracion: string;
  segundosRestantes: number;
  fechaCanje: string | null;
  validadoPor: string | null;
  premio: {
    id: string;
    titulo: string;
    descripcion: string;
    puntosRequeridos: number;
    imagenUrl: string | null;
  };
}

export default function SocioCanjePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [canje, setCanje] = useState<CanjeDetalle | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCanje = async () => {
    try {
      const res = await fetch(`/api/socio/canje/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) {
        setCanje(data.canje);
        setTimeLeft(data.canje.segundosRestantes);

        // Generar imagen QR con tinte vino elegante
        if (data.canje.codigoQR && !qrDataUrl) {
          try {
            const url = await QRCode.toDataURL(data.canje.codigoQR, {
              width: 280,
              margin: 2,
              color: {
                dark: "#5c131d",
                light: "#ffffff",
              },
            });
            setQrDataUrl(url);
          } catch (qrErr) {
            console.error("Error generando QR:", qrErr);
          }
        }
      } else {
        setErrorMessage(data.error || "No se encontró el cupón.");
      }
    } catch {
      setErrorMessage("Error al consultar el estado del cupón.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanje();
  }, [resolvedParams.id]);

  // Polling cada 3 segundos si está PENDIENTE
  useEffect(() => {
    if (!canje || canje.estado !== "PENDIENTE") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/socio/canje/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success) {
          setCanje(data.canje);
          setTimeLeft(data.canje.segundosRestantes);
        }
      } catch (err) {
        console.error("Error en polling de canje:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [canje?.estado, resolvedParams.id]);

  // Temporizador regresivo segundo a segundo
  useEffect(() => {
    if (timeLeft <= 0 || canje?.estado !== "PENDIENTE") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchCanje();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, canje?.estado]);

  const handleCancelar = async () => {
    if (!confirm("¿Seguro que deseas cancelar este canje? Tus puntos volverán a estar disponibles de inmediato.")) {
      return;
    }

    setCancelando(true);
    try {
      const res = await fetch(`/api/socio/canje/${resolvedParams.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/socio/premios");
      } else {
        alert(data.error || "No se pudo cancelar el canje.");
      }
    } catch {
      alert("Error de conexión al cancelar el canje.");
    } finally {
      setCancelando(false);
    }
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010101] text-stone-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#ce7281] mb-2" />
        <p className="text-xs text-stone-400">Cargando cupón Wine Bistro...</p>
      </div>
    );
  }

  if (errorMessage || !canje) {
    return (
      <div className="min-h-screen bg-[#010101] text-stone-100 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
        <h2 className="text-base font-bold text-white">No se pudo cargar el cupón</h2>
        <p className="text-xs text-stone-400 max-w-xs mt-1">{errorMessage}</p>
        <Link
          href="/socio/premios"
          className="mt-4 bg-[#5c131d] hover:bg-[#7a1a27] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/socio/premios"
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition"
              title="Volver a premios"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
              />
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#ce7281] leading-none">
                  Voucher
                </p>
                <h1 className="text-sm font-serif font-bold text-white">Cupón de Recompensa</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Voucher Body */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ESTADO: COMPLETADO (Celebración) */}
        {canje.estado === "COMPLETADO" && (
          <div className="bg-[#0d0708] rounded-3xl p-6 border border-emerald-500/40 shadow-2xl text-center space-y-4 animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1 relative z-10">
              <span className="text-[10px] uppercase font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ¡Premio Entregado en Mesa!
              </span>
              <h2 className="text-2xl font-serif font-bold text-white pt-2">
                ¡Que lo disfrutes!
              </h2>
              <p className="text-sm font-semibold text-[#f5ede6]">
                {canje.premio.titulo}
              </p>
              <p className="text-xs text-stone-400 leading-relaxed pt-1">
                El mozo validó tu cupón y se debitaron{" "}
                <span className="font-bold text-[#d4aa58] font-mono">
                  {canje.puntosGastados} puntos
                </span>
                .
              </p>
            </div>

            <div className="bg-[#050304] rounded-2xl p-3 border border-stone-800 text-xs text-stone-300">
              <p className="text-[11px] text-emerald-400 font-semibold">Validación Exitosa en Salón</p>
              <p className="font-mono text-[11px] mt-0.5 text-stone-400">
                Código: <span className="font-bold text-white">{canje.codigoQR}</span>
              </p>
              {canje.validadoPor && (
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Atendido por: {canje.validadoPor}
                </p>
              )}
            </div>

            <Link
              href="/socio/dashboard"
              className="w-full block py-3.5 bg-[#5c131d] hover:bg-[#7a1a27] text-white text-xs font-bold rounded-2xl shadow transition"
            >
              Volver a mi panel de socio
            </Link>
          </div>
        )}

        {/* ESTADO: EXPIRADO */}
        {canje.estado === "EXPIRADO" && (
          <div className="bg-[#0d0708] rounded-3xl p-6 border border-stone-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-stone-400 border border-stone-800 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-serif font-bold text-white">Cupón Expirado</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                Transcurrieron los 15 minutos sin ser validado en mesa. Los{" "}
                <span className="font-bold text-[#d4aa58] font-mono">
                  {canje.puntosGastados} puntos
                </span>{" "}
                fueron reintegrados a tu saldo sin ningún descuento.
              </p>
            </div>

            <Link
              href="/socio/premios"
              className="w-full block py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold rounded-xl transition"
            >
              Volver al catálogo de premios
            </Link>
          </div>
        )}

        {/* ESTADO: CANCELADO */}
        {canje.estado === "CANCELADO" && (
          <div className="bg-[#0d0708] rounded-3xl p-6 border border-stone-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-stone-400 border border-stone-800 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-serif font-bold text-white">Cupón Cancelado</h2>
              <p className="text-xs text-stone-400">
                Cancelaste este cupón voluntariamente. Tus puntos están listos para ser utilizados.
              </p>
            </div>

            <Link
              href="/socio/premios"
              className="w-full block py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold rounded-xl transition"
            >
              Volver al catálogo
            </Link>
          </div>
        )}

        {/* ESTADO: PENDIENTE (Voucher QR en Vivo) */}
        {canje.estado === "PENDIENTE" && (
          <div className="bg-[#0d0708] rounded-3xl border border-[#5c131d]/50 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#5c131d]/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header del Ticket */}
            <div className="bg-gradient-to-r from-[#5c131d] via-[#7a1a27] to-[#3a0b12] text-white p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#f5ede6] text-[10px] font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#d4aa58]" />
                <span>Presentá este código al mozo</span>
              </div>
              <h2 className="text-lg font-serif font-bold leading-tight">{canje.premio.titulo}</h2>
              <p className="text-xs text-[#d4aa58] font-mono font-bold mt-0.5">
                {canje.puntosGastados.toLocaleString("es-AR")} puntos
              </p>
            </div>

            {/* Código QR + Temporizador */}
            <div className="p-6 text-center space-y-4 relative z-10">
              {/* Temporizador */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5c131d]/20 text-[#f5ede6] border border-[#5c131d]/40 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse text-[#e18693]" />
                <span>Vence en {formatMinutes(timeLeft)}</span>
              </div>

              {/* Imagen del Código QR */}
              <div className="flex justify-center my-2">
                {qrDataUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-[#5c131d]/30">
                    <img
                      src={qrDataUrl}
                      alt={`QR ${canje.codigoQR}`}
                      className="w-56 h-56 mx-auto rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 mx-auto bg-[#050304] border border-stone-800 rounded-2xl flex items-center justify-center text-stone-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              {/* Código alfanumérico legible */}
              <div>
                <p className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">
                  Código de Validación
                </p>
                <p className="text-3xl font-mono font-extrabold tracking-widest text-white select-all mt-0.5">
                  {canje.codigoQR}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  El mozo puede escanear el QR o ingresar este código en su tablet
                </p>
              </div>

              {/* Instrucción y Botón Cancelar */}
              <div className="pt-4 border-t border-stone-800/80 flex flex-col gap-2">
                <p className="text-[11px] text-stone-400 italic">
                  Esta pantalla se actualizará automáticamente cuando tu mozo valide el cupón.
                </p>
                <button
                  type="button"
                  disabled={cancelando}
                  onClick={handleCancelar}
                  className="text-stone-400 hover:text-red-400 text-xs font-medium py-2 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{cancelando ? "Cancelando..." : "Cancelar este canje y recuperar puntos"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}