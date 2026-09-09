"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
        // Redirigir a la pantalla del cupón QR
        router.push(`/socio/canje/${data.canjeId}`);
      } else {
        if (data.canjePendienteId) {
          // Si ya tenía uno, sugerir ir al cupón activo
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || "No se pudo generar el cupón.");
        }
        setPremioSeleccionado(null);
      }
    } catch {
      setErrorMessage("Error de red al procesar el canje.");
      setPremioSeleccionado(null);
    } finally {
      setCanjeando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf7f0] text-stone-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-amber-200/60 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/socio/dashboard"
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 transition"
              title="Volver a mi panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold text-amber-950 font-serif leading-none">
                La Encontrada
              </p>
              <h1 className="text-sm font-bold text-stone-900">Catálogo de Premios</h1>
            </div>
          </div>

          {socio && (
            <div className="text-right">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
                Disponibles
              </span>
              <p className="text-sm font-bold font-mono text-amber-800 leading-none">
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
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-200 text-xs font-semibold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Cupón Activo en Espera</span>
              </div>
              <p className="text-sm font-bold">{socio.canjeActivo.premioTitulo}</p>
              <p className="text-[11px] text-amber-100">
                Código: <span className="font-mono font-bold">{socio.canjeActivo.codigoQR}</span>
              </p>
            </div>
            <Link
              href={`/socio/canje/${socio.canjeActivo.id}`}
              className="bg-white text-amber-900 px-3 py-2 rounded-xl text-xs font-bold shadow hover:bg-amber-50 transition shrink-0 flex items-center gap-1"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver QR</span>
            </Link>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              {socio?.canjeActivo && (
                <div className="mt-1">
                  <Link
                    href={`/socio/canje/${socio.canjeActivo.id}`}
                    className="font-bold underline text-red-900"
                  >
                    Ir a mi cupón pendiente →
                  </Link>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Intro */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Recompensas por tu fidelidad</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Selecciona el premio que prefieras. Se generará un cupón QR para mostrarle a tu mozo.
            </p>
          </div>
        </div>

        {/* List of Prizes */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-800" />
            <p className="text-xs">Cargando premios disponibles...</p>
          </div>
        ) : premios.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-amber-200/60 text-center text-stone-500">
            <Gift className="w-10 h-10 mx-auto text-amber-700/40 mb-2" />
            <p className="font-semibold text-sm">Próximamente más premios</p>
            <p className="text-xs text-stone-400 mt-1">
              Estamos renovando la carta de beneficios.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {premios.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between shadow-sm ${
                  p.puedeCanjear
                    ? "border-amber-300 hover:border-amber-400 ring-1 ring-amber-300/40"
                    : "border-amber-200/60 opacity-90"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-sm text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      {p.puntosRequeridos.toLocaleString("es-AR")} pts
                    </span>

                    {!p.tieneStock ? (
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PackageX className="w-3 h-3" /> Sin stock
                      </span>
                    ) : p.puedeCanjear ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> ¡Alcanzas los puntos!
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Te faltan {p.puntosFaltantes.toLocaleString("es-AR")} pts
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-stone-900">{p.titulo}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{p.descripcion}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-[11px] text-stone-400 font-medium">
                    {p.stock === -1
                      ? "Disponibilidad permanente"
                      : `${p.stock} disponibles`}
                  </div>

                  {p.puedeCanjear ? (
                    <button
                      onClick={() => setPremioSeleccionado(p)}
                      className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Canjear</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-stone-100 text-stone-400 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-not-allowed flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Confirmación de Canje */}
      {premioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-1">
              <Gift className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900">¿Confirmar este canje?</h3>
              <p className="text-sm font-semibold text-amber-900">
                {premioSeleccionado.titulo}
              </p>
              <p className="text-xs text-stone-500 pt-1 leading-relaxed">
                Se generará un cupón QR con <span className="font-bold text-stone-800">15 minutos de vigencia</span> para que tu mozo lo escanee en la mesa.
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-center">
              <p className="text-[11px] text-amber-800/80 font-medium">Costo de la recompensa</p>
              <p className="text-xl font-mono font-extrabold text-amber-950">
                {premioSeleccionado.puntosRequeridos.toLocaleString("es-AR")} puntos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={canjeando}
                onClick={() => setPremioSeleccionado(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={canjeando}
                onClick={handleConfirmarCanje}
                className="py-2.5 px-4 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                {canjeando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                <span>Generar QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}