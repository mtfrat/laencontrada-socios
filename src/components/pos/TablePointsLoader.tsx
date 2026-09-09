"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Users,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  DollarSign,
  UserPlus,
  Phone,
  Mail,
} from "lucide-react";

interface SocioItem {
  id: string;
  dni: string;
  nombre: string;
  apellido?: string | null;
  numeroSocio: string;
  puntosActuales: number;
}

interface TablePointsLoaderProps {
  pesosPorPunto: number;
}

export default function TablePointsLoader({ pesosPorPunto = 1000 }: TablePointsLoaderProps) {
  // Estado de la mesa
  const [totalTicket, setTotalTicket] = useState<string>("");
  const [comensales, setComensales] = useState<number>(2);
  const [selectedSocios, setSelectedSocios] = useState<SocioItem[]>([]);
  const [notas, setNotas] = useState<string>("");

  // Estado del buscador de socios
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SocioItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Modal Alta Rápida de Socio
  const [altaModalOpen, setAltaModalOpen] = useState(false);
  const [altaDni, setAltaDni] = useState("");
  const [altaNombre, setAltaNombre] = useState("");
  const [altaApellido, setAltaApellido] = useState("");
  const [altaTelefono, setAltaTelefono] = useState("");
  const [altaEmail, setAltaEmail] = useState("");
  const [altaSubmitting, setAltaSubmitting] = useState(false);
  const [altaError, setAltaError] = useState<string | null>(null);

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    puntosPorSocio: number;
    gastoPromedioPorPersona: number;
    sociosAcreditados: Array<{ id: string; nombre: string; dni: string; puntosActuales: number }>;
  } | null>(null);

  // Cálculo en tiempo real
  const { gastoPromedio, puntosCalculados } = useMemo(() => {
    const monto = parseFloat(totalTicket) || 0;
    if (monto <= 0 || comensales < 1) {
      return { gastoPromedio: 0, puntosCalculados: 0 };
    }
    const promedio = Math.round((monto / comensales) * 100) / 100;
    const puntos = Math.floor(promedio / pesosPorPunto);
    return { gastoPromedio: promedio, puntosCalculados: puntos };
  }, [totalTicket, comensales, pesosPorPunto]);

  // Búsqueda en vivo de socios
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/socios/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          // Filtrar los que ya están seleccionados
          const selectedIds = new Set(selectedSocios.map((s) => s.id));
          setSearchResults(data.socios.filter((s: SocioItem) => !selectedIds.has(s.id)));
        }
      } catch {
        // Silencioso
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSocios]);

  const addSocio = (socio: SocioItem) => {
    if (selectedSocios.length >= comensales) {
      setError(`No puedes agregar más socios (${selectedSocios.length + 1}) que comensales (${comensales}).`);
      return;
    }
    setError(null);
    setSelectedSocios((prev) => [...prev, socio]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeSocio = (id: string) => {
    setSelectedSocios((prev) => prev.filter((s) => s.id !== id));
  };

  const openAltaModal = (prefill?: string) => {
    setAltaError(null);
    const text = (prefill || "").trim();
    if (text) {
      if (/^\d+$/.test(text)) {
        setAltaDni(text);
        setAltaNombre("");
      } else {
        setAltaDni("");
        setAltaNombre(text);
      }
    } else {
      setAltaDni("");
      setAltaNombre("");
    }
    setAltaApellido("");
    setAltaTelefono("");
    setAltaEmail("");
    setAltaModalOpen(true);
  };

  const handleAltaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAltaError(null);

    const cleanDni = altaDni.replace(/\D/g, "").trim();
    if (cleanDni.length < 5) {
      setAltaError("El DNI debe tener al menos 5 dígitos numéricos.");
      return;
    }

    if (!altaNombre.trim()) {
      setAltaError("El nombre del socio es obligatorio.");
      return;
    }

    setAltaSubmitting(true);
    try {
      const res = await fetch("/api/pos/socios/alta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: cleanDni,
          nombre: altaNombre.trim(),
          apellido: altaApellido.trim() || undefined,
          telefono: altaTelefono.trim() || undefined,
          email: altaEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAltaError(data.error || "No se pudo registrar el nuevo socio.");
        setAltaSubmitting(false);
        return;
      }

      // Agregar inmediatamente el socio a la mesa
      addSocio(data.socio);
      setAltaModalOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch {
      setAltaError("Error de comunicación con el servidor.");
    } finally {
      setAltaSubmitting(false);
    }
  };

  const addTestSocio = async () => {
    try {
      const res = await fetch(`/api/socios/search?q=12345678`);
      const data = await res.json();
      if (data.success && data.socios.length > 0) {
        addSocio(data.socios[0]);
      }
    } catch {
      // Silencioso
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const monto = parseFloat(totalTicket) || 0;
    if (monto <= 0) {
      setError("Ingresa el monto facturado del ticket.");
      return;
    }

    if (selectedSocios.length === 0) {
      setError("Debes agregar al menos 1 socio presente en la mesa.");
      return;
    }

    if (selectedSocios.length > comensales) {
      setError("La cantidad de socios no puede superar los comensales.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/pos/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoTotalTicket: monto,
          cantidadComensales: comensales,
          sociosIds: selectedSocios.map((s) => s.id),
          notas,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No se pudieron acreditar los puntos.");
        setSubmitting(false);
        return;
      }

      setSuccessData({
        puntosPorSocio: data.data.puntosPorSocio,
        gastoPromedioPorPersona: data.data.gastoPromedioPorPersona,
        sociosAcreditados: data.data.sociosAcreditados,
      });
      setSubmitting(false);
    } catch {
      setError("Error de red al conectar con el servidor.");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTotalTicket("");
    setComensales(2);
    setSelectedSocios([]);
    setNotas("");
    setError(null);
    setSuccessData(null);
  };

  // Si ya se acreditó exitosamente, mostramos la pantalla de confirmación
  if (successData) {
    return (
      <div className="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-emerald-500/40 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-white">
          ¡Puntos Acreditados con Éxito!
        </h2>
        <p className="text-stone-400 text-sm mt-1">
          La mesa fue registrada y los puntos se encuentran disponibles en la cuenta del cliente.
        </p>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 gap-3 my-6 max-w-sm mx-auto">
          <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-700">
            <p className="text-[11px] text-stone-400">Puntos por Socio</p>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
              +{successData.puntosPorSocio} pts
            </p>
          </div>
          <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-700">
            <p className="text-[11px] text-stone-400">Gasto Individual</p>
            <p className="text-2xl font-bold font-mono text-stone-200 mt-0.5">
              ${successData.gastoPromedioPorPersona.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* Lista de socios beneficiados */}
        <div className="bg-stone-900/80 rounded-2xl p-4 border border-stone-700/80 max-w-md mx-auto text-left mb-6">
          <p className="text-xs font-semibold uppercase text-stone-400 mb-2.5">
            Socios que recibieron puntos:
          </p>
          <div className="space-y-2">
            {successData.sociosAcreditados.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-800 last:border-none">
                <div>
                  <span className="font-semibold text-white">{s.nombre}</span>
                  <span className="text-stone-400 text-[11px] ml-2 font-mono">DNI: {s.dni}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  Nuevo saldo: {s.puntosActuales} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={resetForm}
          className="py-3.5 px-6 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg transition"
        >
          Cargar Siguiente Mesa
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-stone-700 shadow-xl">
      <div className="flex items-center justify-between pb-5 border-b border-stone-700/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Carga de Mesa y Puntos</h2>
            <p className="text-xs text-stone-400">
              Ratio activo: ${pesosPorPunto.toLocaleString("es-AR")} = 1 punto
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800 text-red-200 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1 & 2: Monto y Comensales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Monto del ticket */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              1. Monto Total del Ticket ($)
            </label>
            <div className="relative">
              <DollarSign className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="Ej: 100000"
                value={totalTicket}
                onChange={(e) => setTotalTicket(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-2xl text-xl font-mono text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>

            {/* Botones de sugerencia rápida */}
            <div className="flex gap-2 mt-2">
              {[50000, 80000, 100000, 150000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTotalTicket(String(val))}
                  className="text-[10px] font-mono bg-stone-900 hover:bg-stone-700 text-stone-400 hover:text-white px-2 py-1 rounded-lg border border-stone-700 transition"
                >
                  ${val / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad de comensales */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              2. Cantidad de Comensales
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setComensales((c) => Math.max(1, c - 1))}
                className="w-12 h-12 rounded-2xl bg-stone-900 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center font-bold text-lg transition"
              >
                -
              </button>
              <div className="flex-1 text-center py-2.5 bg-stone-900 border border-stone-700 rounded-2xl">
                <span className="text-2xl font-bold font-mono text-white">{comensales}</span>
                <span className="text-xs text-stone-400 ml-1.5">personas</span>
              </div>
              <button
                type="button"
                onClick={() => setComensales((c) => c + 1)}
                className="w-12 h-12 rounded-2xl bg-stone-900 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center font-bold text-lg transition"
              >
                +
              </button>
            </div>

            {/* Accesos rápidos comensales */}
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setComensales(num)}
                  className={`flex-1 text-[11px] font-mono py-1 rounded-lg border transition ${
                    comensales === num
                      ? "bg-orange-600 text-white border-orange-500 font-bold"
                      : "bg-stone-900 text-stone-400 hover:text-white border-stone-700"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESUMEN DE CÁLCULO EN VIVO */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 p-4 rounded-2xl border border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-stone-400">Gasto Individual Promedio:</span>
            <p className="text-lg font-mono font-bold text-stone-200">
              ${gastoPromedio.toLocaleString("es-AR")} <span className="text-xs font-normal text-stone-400">por persona</span>
            </p>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-amber-400 font-semibold uppercase flex items-center gap-1 sm:justify-end">
              <Sparkles className="w-3.5 h-3.5" /> Puntos a sumar por socio:
            </span>
            <p className="text-2xl font-mono font-extrabold text-amber-400">
              {puntosCalculados} <span className="text-sm font-semibold">pts</span>
            </p>
          </div>
        </div>

        {/* PASO 3: Buscar y Agregar Socios */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              3. Socios Presentes en la Mesa ({selectedSocios.length} de {comensales})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAltaModal(searchQuery)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-xl border border-orange-500/30 transition shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Registrar Nuevo Socio</span>
              </button>
              <button
                type="button"
                onClick={addTestSocio}
                className="text-[11px] text-stone-400 hover:text-amber-400 hover:underline hidden md:inline-block"
              >
                + Demo (12345678)
              </button>
            </div>
          </div>

          {/* Chips de socios seleccionados */}
          {selectedSocios.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSocios.map((socio) => (
                <div
                  key={socio.id}
                  className="bg-stone-900 text-stone-100 pl-3 pr-2 py-1.5 rounded-xl border border-orange-500/40 flex items-center gap-2 text-xs shadow-sm"
                >
                  <div>
                    <span className="font-bold text-white">{socio.nombre} {socio.apellido || ""}</span>
                    <span className="text-stone-400 text-[10px] ml-1.5 font-mono">DNI: {socio.dni}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocio(socio.id)}
                    className="w-5 h-5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 flex items-center justify-center transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Buscador de socios */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por DNI o Nombre de socio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-stone-400 animate-spin absolute right-3.5 top-3.5" />
            )}

            {/* Dropdown de resultados */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-stone-800">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addSocio(s)}
                    className="w-full px-4 py-2.5 text-left hover:bg-stone-800 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <p className="font-bold text-white">{s.nombre} {s.apellido || ""}</p>
                      <p className="text-stone-400 text-[11px] font-mono">
                        DNI: {s.dni} • Nro: {s.numeroSocio}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-semibold">
                        {s.puntosActuales} pts
                      </span>
                      <span className="p-1 rounded bg-orange-600 text-white">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sugerencia de alta cuando no se encuentra el socio buscado */}
          {searchQuery.trim().length >= 3 && !searching && searchResults.length === 0 && (
            <div className="mt-2.5 p-3.5 bg-stone-900 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-stone-300 text-center sm:text-left">
                <span className="font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  ¿Socio no registrado?
                </span>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  No encontramos a &quot;{searchQuery}&quot;. Puedes asociarlo en segundos para acreditarle los puntos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAltaModal(searchQuery)}
                className="shrink-0 bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Dar de alta a este socio</span>
              </button>
            </div>
          )}
        </div>

        {/* Notas adicionales opcionales */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
            Notas de la comanda / Mesa (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Mesa 12 - Cumpleaños"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full px-3.5 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
          />
        </div>

        {/* Botón de Confirmación Principal */}
        <button
          type="submit"
          disabled={submitting || selectedSocios.length === 0 || !totalTicket}
          className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Acreditando puntos en la mesa...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Acreditar {puntosCalculados} pts a {selectedSocios.length} socio(s)
            </>
          )}
        </button>
      </form>

      {/* MODAL ALTA RÁPIDA DE SOCIO EN SALÓN */}
      {altaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alta Rápida de Socio</h3>
                  <p className="text-[11px] text-stone-400">
                    Se sumará automáticamente a la mesa en curso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAltaModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {altaError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{altaError}</span>
              </div>
            )}

            <form onSubmit={handleAltaSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DNI */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoFocus
                    placeholder="Ej: 38450123"
                    value={altaDni}
                    onChange={(e) => setAltaDni(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>WhatsApp (Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 2914123456"
                    value={altaTelefono}
                    onChange={(e) => setAltaTelefono(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carolina"
                    value={altaNombre}
                    onChange={(e) => setAltaNombre(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Apellido (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Gómez"
                    value={altaApellido}
                    onChange={(e) => setAltaApellido(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-stone-400" />
                  <span>Email (Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={altaEmail}
                  onChange={(e) => setAltaEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  disabled={altaSubmitting}
                  onClick={() => setAltaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-white transition text-xs font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={altaSubmitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-xs"
                >
                  {altaSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Guardar y Sumar a Mesa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
