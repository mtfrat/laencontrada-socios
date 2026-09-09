"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  Download,
  UserPlus,
} from "lucide-react";

interface SocioItem {
  id: string;
  numeroSocio: string;
  dni: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
  puntosActuales: number;
  puntosHistoricos: number;
  activo: boolean;
  fechaAlta: string;
  totalVisitas: number;
  totalCanjes: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SociosManager() {
  const [socios, setSocios] = useState<SocioItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Ajuste de Puntos
  const [modalSocio, setModalSocio] = useState<SocioItem | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<"sumar" | "restar">("sumar");
  const [puntosAjuste, setPuntosAjuste] = useState<number>(50);
  const [motivoAjuste, setMotivoAjuste] = useState("");
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  // Modal Nuevo Socio
  const [modalNuevoSocio, setModalNuevoSocio] = useState(false);
  const [nuevoDni, setNuevoDni] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPuntos, setNuevoPuntos] = useState(0);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  // Notificaciones
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSocios = useCallback(async (pageToLoad = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: "25",
      });
      if (searchQuery.trim()) {
        params.append("query", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/socios?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSocios(data.socios);
        setPagination(data.pagination);
      } else {
        setErrorMessage(data.error || "No se pudo cargar la nómina de socios.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar socios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSocios(1, query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSocios]);

  const handleToggleActivo = async (socio: SocioItem) => {
    try {
      const res = await fetch("/api/admin/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_activo",
          socioId: socio.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSocios((prev) =>
          prev.map((s) => (s.id === socio.id ? { ...s, activo: data.activo } : s))
        );
        setToastMessage(`Cuenta de ${socio.nombre} ${data.activo ? "activada" : "pausada"}.`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setErrorMessage(data.error);
      }
    } catch {
      setErrorMessage("Error al cambiar estado del socio.");
    }
  };

  const handleOpenAjuste = (socio: SocioItem) => {
    setModalSocio(socio);
    setTipoAjuste("sumar");
    setPuntosAjuste(50);
    setMotivoAjuste("");
  };

  const handleSubmitAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSocio) return;
    if (!motivoAjuste.trim()) {
      alert("Debes ingresar un motivo para el ajuste.");
      return;
    }

    const valorFinal = tipoAjuste === "sumar" ? Math.abs(puntosAjuste) : -Math.abs(puntosAjuste);

    setGuardandoAjuste(true);
    try {
      const res = await fetch("/api/admin/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ajuste_puntos",
          socioId: modalSocio.id,
          puntos: valorFinal,
          motivo: motivoAjuste.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message);
        setModalSocio(null);
        await fetchSocios(pagination.page, query);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(data.error || "No se pudo realizar el ajuste.");
      }
    } catch {
      alert("Error de red al registrar el ajuste.");
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const handleExportCsv = () => {
    window.open("/api/admin/socios/export", "_blank");
  };

  const handleCrearSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNuevo(null);

    const cleanDni = nuevoDni.replace(/\D/g, "").trim();
    if (cleanDni.length < 5) {
      setErrorNuevo("El DNI debe contener al menos 5 dígitos numéricos.");
      return;
    }

    if (!nuevoNombre.trim()) {
      setErrorNuevo("El nombre es obligatorio.");
      return;
    }

    setGuardandoNuevo(true);
    try {
      const res = await fetch("/api/admin/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "crear_socio",
          dni: cleanDni,
          nombre: nuevoNombre.trim(),
          apellido: nuevoApellido.trim() || undefined,
          telefono: nuevoTelefono.trim() || undefined,
          email: nuevoEmail.trim() || undefined,
          puntosIniciales: nuevoPuntos,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message);
        setModalNuevoSocio(false);
        setNuevoDni("");
        setNuevoNombre("");
        setNuevoApellido("");
        setNuevoTelefono("");
        setNuevoEmail("");
        setNuevoPuntos(0);
        await fetchSocios(1, query);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setErrorNuevo(data.error || "Error al registrar el nuevo socio.");
      }
    } catch {
      setErrorNuevo("Error de comunicación con el servidor.");
    } finally {
      setGuardandoNuevo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-red-950/60 border border-red-800 text-red-200 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar: Live Search & Action Buttons & Counters */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por DNI, N° de socio, nombre o email..."
            className="w-full bg-stone-950 border border-stone-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Botón Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition flex items-center gap-2 text-xs font-semibold shadow"
            title="Descargar base completa de socios en CSV compatible con Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          {/* Botón Nuevo Socio */}
          <button
            type="button"
            onClick={() => {
              setErrorNuevo(null);
              setModalNuevoSocio(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition flex items-center gap-1.5 text-xs shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Socio</span>
          </button>

          {/* Contador de padrón */}
          <div className="border-l border-stone-800 pl-3 flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-[10px] text-stone-400 uppercase font-medium">Padrón</p>
              <p className="text-lg font-bold font-mono text-amber-400">
                {pagination.total.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-stone-400 space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
            <p className="text-xs">Cargando nómina de socios...</p>
          </div>
        ) : socios.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Users className="w-12 h-12 mx-auto mb-2 text-stone-600" />
            <p className="font-semibold text-white">No se encontraron socios</p>
            <p className="text-xs text-stone-500 mt-1">Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Socio</th>
                  <th className="py-3.5 px-4 font-mono">DNI</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4 text-right">Puntos Actuales</th>
                  <th className="py-3.5 px-4 text-center">Visitas</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {socios.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-800/40 transition">
                    {/* Socio / Membresía */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {s.numeroSocio}
                        </span>
                        <div>
                          <p className="font-bold text-white text-xs">
                            {s.nombre} {s.apellido || ""}
                          </p>
                          <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Alta: {new Date(s.fechaAlta).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DNI */}
                    <td className="py-3 px-4 font-mono font-semibold text-stone-200">
                      {s.dni}
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-4 space-y-0.5">
                      {s.email ? (
                        <p className="text-[11px] text-stone-300 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{s.email}</span>
                        </p>
                      ) : (
                        <span className="text-[10px] text-stone-600 italic">Sin email</span>
                      )}
                      {s.telefono && (
                        <p className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-stone-500 shrink-0" />
                          <span>{s.telefono}</span>
                        </p>
                      )}
                    </td>

                    {/* Puntos */}
                    <td className="py-3 px-4 text-right">
                      <p className="font-mono font-bold text-sm text-amber-400">
                        {s.puntosActuales.toLocaleString("es-AR")} pts
                      </p>
                      <p className="text-[10px] font-mono text-stone-500">
                        Histórico: {s.puntosHistoricos}
                      </p>
                    </td>

                    {/* Visitas */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-xs text-stone-300">
                        {s.totalVisitas}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          s.activo
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {s.activo ? "Activo" : "Pausado"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAjuste(s)}
                          className="px-2.5 py-1.5 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-amber-400 rounded-xl font-bold text-[11px] transition flex items-center gap-1 border border-stone-700"
                          title="Ajustar puntos manualmente"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Ajustar</span>
                        </button>

                        <button
                          onClick={() => handleToggleActivo(s)}
                          className="p-1.5 text-stone-400 hover:text-white rounded-lg transition"
                          title={s.activo ? "Pausar cuenta" : "Activar cuenta"}
                        >
                          {s.activo ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-stone-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="bg-stone-950/60 border-t border-stone-800 px-4 py-3 flex items-center justify-between text-xs text-stone-400">
            <span>
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} socios)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSocios(pagination.page - 1, query)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSocios(pagination.page + 1, query)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajuste Manual de Puntos */}
      {modalSocio && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Ajuste Manual de Puntos</h3>
              </div>
              <button
                onClick={() => setModalSocio(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-950 rounded-2xl p-3 border border-stone-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">
                  {modalSocio.nombre} {modalSocio.apellido || ""}
                </p>
                <p className="text-[11px] font-mono text-stone-400">
                  {modalSocio.numeroSocio} • DNI: {modalSocio.dni}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-stone-500 font-medium">Saldo Actual</p>
                <p className="font-mono font-bold text-amber-400 text-base">
                  {modalSocio.puntosActuales} pts
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAjuste} className="space-y-4 text-xs">
              {/* Selector Sumar / Restar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoAjuste("sumar")}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                    tipoAjuste === "sumar"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-stone-800 text-stone-400 hover:text-white"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Acreditar (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoAjuste("restar")}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                    tipoAjuste === "restar"
                      ? "bg-red-600 text-white shadow"
                      : "bg-stone-800 text-stone-400 hover:text-white"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Debitar (-)</span>
                </button>
              </div>

              {/* Cantidad de Puntos */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Cantidad de Puntos *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={puntosAjuste}
                  onChange={(e) => setPuntosAjuste(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 font-mono font-bold text-base focus:outline-none focus:border-amber-500"
                />

                {/* Presets rápidos */}
                <div className="flex gap-1.5 mt-2">
                  {[25, 50, 100, 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPuntosAjuste(v)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[11px] transition"
                    >
                      {v} pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo Obligatorio */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Motivo del Ajuste (Auditoría Gerencial) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ej: Compensación por demora en cocina, carga manual de visita previa..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  disabled={guardandoAjuste}
                  onClick={() => setModalSocio(null)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoAjuste}
                  className={`px-5 py-2 rounded-xl font-bold text-stone-950 shadow transition flex items-center gap-1.5 ${
                    tipoAjuste === "sumar"
                      ? "bg-emerald-500 hover:bg-emerald-400"
                      : "bg-red-500 hover:bg-red-400"
                  }`}
                >
                  {guardandoAjuste ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    Confirmar {tipoAjuste === "sumar" ? `+${puntosAjuste}` : `-${puntosAjuste}`} pts
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alta de Nuevo Socio desde Admin */}
      {modalNuevoSocio && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Nuevo Socio</h3>
                  <p className="text-[11px] text-stone-400">Padrón de Club La Encontrada</p>
                </div>
              </div>
              <button
                onClick={() => setModalNuevoSocio(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorNuevo && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorNuevo}</span>
              </div>
            )}

            <form onSubmit={handleCrearSocio} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
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
                    value={nuevoDni}
                    onChange={(e) => setNuevoDni(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 2914123456"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Nombre */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carolina"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Gómez"
                    value={nuevoApellido}
                    onChange={(e) => setNuevoApellido(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Puntos Iniciales */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1 flex items-center justify-between">
                  <span>Puntos de Bienvenida Iniciales</span>
                  <span className="text-[10px] text-stone-500 font-normal">Opcional</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    value={nuevoPuntos}
                    onChange={(e) => setNuevoPuntos(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-28 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1">
                    {[0, 50, 100, 200].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setNuevoPuntos(pts)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          nuevoPuntos === pts
                            ? "bg-amber-500 text-stone-950 font-bold border-amber-400"
                            : "bg-stone-800 text-stone-400 hover:text-white border-stone-700"
                        }`}
                      >
                        {pts} pts
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  disabled={guardandoNuevo}
                  onClick={() => setModalNuevoSocio(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoNuevo}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow transition flex items-center gap-1.5"
                >
                  {guardandoNuevo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar en Padrón</span>
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