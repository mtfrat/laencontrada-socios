"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Gift,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  QrCode,
  Clock,
  PackageX,
  X,
  ChevronRight,
  Wine,
} from "lucide-react";

interface PremioCatalogo {
  id: string;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  imagenUrl: string | null;
  stock: number;
  tieneStock: boolean;
  puedeCanjear: boolean;
  puntosFaltantes: number;
}

interface SocioData {
  id: string;
  nombre: string;
  puntosActuales: number;
  puntosDisponibles: number;
  puntosRetenidos: number;
  canjeActivo: {
    id: string;
    codigoQR: string;
    premioTitulo: string;
    puntosGastados: number;
    fechaExpiracion: string;
  } | null;
}

export default function SocioPremiosPage() {
  const router = useRouter();
  const [socio, setSocio] = useState<SocioData | null>(null);
  const [premios, setPremios] = useState<PremioCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal confirmación
  const [premioSeleccionado, setPremioSeleccionado] = useState<PremioCatalogo | null>(null);
  const [canjeando, setCanjeando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCatalogo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/socio/premios");
      const data = await res.json();
      if (data.success) {
        setSocio(data.socio);
        setPremios(data.premios);
      } else {
        setErrorMessage(data.error || "No se pudo cargar el catálogo.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar los premios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const handleConfirmarCanje = async () => {
    if (!premioSeleccionado) return;
    setCanjeando(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/socio/canje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premioId: premioSeleccionado.id }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/socio/canje/${data.canjeId}`);
      } else {
        if (data.canjePendienteId) {
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || "No se pudo solicitar el canje.");
        }
        setPremioSeleccionado(null);
      }
    } catch {
      setErrorMessage("Error de red al procesar tu solicitud.");
      setPremioSeleccionado(null);
    } finally {
      setCanjeando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/socio/dashboard"
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition"
              title="Volver a mi panel"
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
                  Catálogo
                </p>
                <h1 className="text-sm font-serif font-bold text-white">Premios & Recompensas</h1>
              </div>
            </div>
          </div>

          {socio && (
            <div className="text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                Disponibles
              </span>
              <p className="text-sm font-bold font-mono text-[#d4aa58] leading-none">
                {socio.puntosDisponibles.toLocaleString("es-AR")} pts
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner si tiene un cupón activo pendiente */}
        {socio?.canjeActivo && (
          <div className="bg-gradient-to-r from-[#5c131d] via-[#7a1a27] to-[#3a0b12] text-white rounded-3xl p-4 shadow-xl border border-[#5c131d]/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#e18693] text-xs font-semibold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Cupón Activo en Espera</span>
              </div>
              <p className="text-sm font-bold text-white">{socio.canjeActivo.premioTitulo}</p>
              <p className="text-[11px] text-stone-300">
                Código: <span className="font-mono font-bold text-white">{socio.canjeActivo.codigoQR}</span>
              </p>
            </div>
            <Link
              href={`/socio/canje/${socio.canjeActivo.id}`}
              className="bg-white text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow hover:bg-[#f5ede6] transition shrink-0 flex items-center gap-1"
            >
              <QrCode className="w-4 h-4 text-[#5c131d]" />
              <span>Ver QR</span>
            </Link>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-red-950/60 border border-red-800/80 text-red-200 p-3.5 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              {socio?.canjeActivo && (
                <div className="mt-1">
                  <Link
                    href={`/socio/canje/${socio.canjeActivo.id}`}
                    className="font-bold underline text-[#e18693]"
                  >
                    Ir a mi cupón pendiente →
                  </Link>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Intro */}
        <div className="bg-[#0d0708] rounded-2xl p-4 border border-[#5c131d]/30 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#e18693] border border-[#5c131d]/40 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-serif font-bold text-white">Recompensas Exclusivas</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Selecciona tu premio para generar el cupón QR temporal y presentárselo a tu mozo en la mesa.
            </p>
          </div>
        </div>

        {/* List of Prizes */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#ce7281]" />
            <p className="text-xs">Cargando catálogo Wine Bistro...</p>
          </div>
        ) : premios.length === 0 ? (
          <div className="bg-[#0d0708] rounded-3xl p-8 border border-stone-800 text-center text-stone-400">
            <Wine className="w-10 h-10 mx-auto text-[#ce7281]/40 mb-2" />
            <p className="font-semibold text-sm text-white">Próximamente más recompensas</p>
            <p className="text-xs text-stone-500 mt-1">
              Estamos renovando la cava y la carta de beneficios.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {premios.map((p) => (
              <div
                key={p.id}
                className={`bg-[#0d0708] rounded-2xl p-4 border transition flex flex-col justify-between shadow-xl ${
                  p.puedeCanjear
                    ? "border-[#5c131d]/60 hover:border-[#5c131d]"
                    : "border-stone-800/80 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-sm text-[#d4aa58] bg-[#d4aa58]/10 px-2.5 py-1 rounded-xl border border-[#d4aa58]/30">
                      {p.puntosRequeridos.toLocaleString("es-AR")} pts
                    </span>

                    {!p.tieneStock ? (
                      <span className="text-[10px] font-semibold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full flex items-center gap-1 border border-stone-800">
                        <PackageX className="w-3 h-3" /> Sin stock
                      </span>
                    ) : p.puedeCanjear ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> ¡Alcanzas los puntos!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Te faltan {p.puntosFaltantes} pts
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-white">
                    {p.titulo}
                  </h3>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                    {p.descripcion}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Stock disponible: {p.stock > 999 ? "Ilimitado" : `${p.stock} u.`}
                  </span>

                  <button
                    type="button"
                    disabled={!p.puedeCanjear}
                    onClick={() => setPremioSeleccionado(p)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-40 disabled:cursor-not-allowed bg-[#5c131d] hover:bg-[#7a1a27] text-white"
                  >
                    <span>Canjear</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN DE CANJE */}
      {premioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c131d]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-stone-800 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#e18693] flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-white">Confirmar Canje</h3>
              </div>
              <button
                type="button"
                disabled={canjeando}
                onClick={() => setPremioSeleccionado(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs relative z-10">
              <div className="bg-[#050304] p-3.5 rounded-2xl border border-stone-800">
                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                  Premio Seleccionado
                </p>
                <p className="text-sm font-serif font-bold text-white mt-0.5">
                  {premioSeleccionado.titulo}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {premioSeleccionado.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#050304] p-2.5 rounded-xl border border-stone-800">
                  <p className="text-[10px] text-stone-500">Costo del Canje</p>
                  <p className="text-sm font-mono font-bold text-[#d4aa58]">
                    -{premioSeleccionado.puntosRequeridos} pts
                  </p>
                </div>
                <div className="bg-[#050304] p-2.5 rounded-xl border border-stone-800">
                  <p className="text-[10px] text-stone-500">Tu Saldo Restante</p>
                  <p className="text-sm font-mono font-bold text-stone-200">
                    {((socio?.puntosDisponibles || 0) - premioSeleccionado.puntosRequeridos).toLocaleString("es-AR")} pts
                  </p>
                </div>
              </div>

              <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#ce7281] shrink-0 mt-0.5" />
                <span>
                  Al confirmar, se generará un código QR con <strong>15 minutos</strong> de validez para que el mozo lo valide en tu mesa.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800 relative z-10">
              <button
                type="button"
                disabled={canjeando}
                onClick={() => setPremioSeleccionado(null)}
                className="px-4 py-2.5 text-xs text-stone-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={canjeando}
                onClick={handleConfirmarCanje}
                className="px-5 py-2.5 bg-[#5c131d] hover:bg-[#7a1a27] disabled:bg-stone-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
              >
                {canjeando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando cupón...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generar Cupón QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}