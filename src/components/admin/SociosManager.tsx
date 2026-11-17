"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Plus,
  Minus,
  Download,
  UserPlus,
} from "lucide-react";
import styles from "./SociosRoster.module.css";

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
  const [modalContacto, setModalContacto] = useState<SocioItem | null>(null);
  const [correoContacto, setCorreoContacto] = useState("");
  const [guardandoCorreo, setGuardandoCorreo] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

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

  const handleOpenContacto = (socio: SocioItem) => {
    setModalContacto(socio);
    setCorreoContacto(socio.email ?? "");
    setErrorCorreo(null);
  };

  const handleGuardarCorreo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modalContacto) return;
    setGuardandoCorreo(true);
    setErrorCorreo(null);
    try {
      const response = await fetch("/api/admin/socios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "actualizar_correo", socioId: modalContacto.id, email: correoContacto }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo actualizar el correo.");
      setSocios((current) => current.map((socio) => socio.id === modalContacto.id ? { ...socio, email: data.email } : socio));
      setToastMessage(data.message);
      setModalContacto(null);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      setErrorCorreo(error instanceof Error ? error.message : "No se pudo actualizar el correo.");
    } finally {
      setGuardandoCorreo(false);
    }
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d0708] border border-[#5c131d]/60 text-[#f5ede6] px-4 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-[#3a0b12]/60 border border-red-800/80 text-red-200 p-4 rounded-2xl flex items-center justify-between text-sm">
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
      <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#f5ede6]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o número de socio"
            className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#f5ede6] placeholder-[#f5ede6]/30 focus:outline-none focus:border-[#5c131d] focus:ring-1 focus:ring-[#5c131d]/40 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5ede6]/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Botón Exportar CSV */}
          <a
            href="/api/admin/socios/export"
            className="px-3.5 py-2.5 rounded-2xl bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6] hover:text-white border border-[#5c131d]/30 transition flex items-center gap-2 text-xs font-semibold shadow"
            title="Descargar base completa de socios en CSV compatible con Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </a>

          {/* Botón Nuevo Socio */}
          <button
            type="button"
            onClick={() => {
              setErrorNuevo(null);
              setModalNuevoSocio(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#5c131d] hover:bg-[#731925] text-white font-bold transition flex items-center gap-1.5 text-xs shadow-lg shadow-[#5c131d]/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Socio</span>
          </button>

          {/* Contador de padrón */}
          <div className="border-l border-[#5c131d]/25 pl-3 flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-[10px] text-[#f5ede6]/40 uppercase font-medium">{query.trim() ? "Resultados" : "Socios"}</p>
              <p className="text-lg font-bold font-mono text-[#d4aa58]">
                {pagination.total.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#5c131d]/15 text-[#d4aa58] border border-[#5c131d]/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className={styles.roster}>
        {loading ? (
          <div className="py-20 text-center text-[#f5ede6]/50 space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#5c131d]" />
            <p className="text-xs">Cargando nómina de socios...</p>
          </div>
        ) : socios.length === 0 ? (
          <div className="py-16 text-center text-[#f5ede6]/50">
            <Users className="w-12 h-12 mx-auto mb-2 text-[#5c131d]/40" />
            <p className="font-semibold text-white">No se encontraron socios</p>
            <p className="text-xs text-[#f5ede6]/40 mt-1">{query.trim() ? "Probá otra búsqueda." : "Todavía no hay socios registrados."}</p>
          </div>
        ) : (
          <>
            <div className={styles.desktop}>
              <table className={styles.table}>
                <colgroup>
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "21%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "23%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Socio</th>
                    <th scope="col">Identificación y contacto</th>
                    <th scope="col">Puntos disponibles</th>
                    <th scope="col">Actividad</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Gestión</th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map((s) => (
                    <tr key={s.id} className={s.activo ? undefined : styles.pausedRow}>
                      <td>
                        <p className={styles.name}>{s.nombre} {s.apellido || ""}</p>
                        <p className={styles.memberMeta}>
                          <span className={styles.memberNo}>{s.numeroSocio}</span>
                          <span aria-hidden="true">·</span>
                          Alta {new Date(s.fechaAlta).toLocaleDateString("es-AR")}
                        </p>
                      </td>
                      <td>
                        <p className={styles.dni}>DNI {s.dni}</p>
                        {s.email && <p className={styles.contactLine}><Mail size={13} aria-hidden="true" /><span>{s.email}</span></p>}
                        {s.telefono && <p className={styles.contactLine}><Phone size={13} aria-hidden="true" /><span>{s.telefono}</span></p>}
                        {!s.email && !s.telefono && <p className={styles.missing}>Sin contacto cargado</p>}
                      </td>
                      <td>
                        <p className={styles.pointsValue}>{s.puntosActuales.toLocaleString("es-AR")} <span>pts</span></p>
                        <p className={styles.muted}>Histórico: {s.puntosHistoricos.toLocaleString("es-AR")}</p>
                      </td>
                      <td>
                        <p className={styles.activityValue}>{s.totalVisitas} {s.totalVisitas === 1 ? "visita" : "visitas"}</p>
                        <p className={styles.muted}>{s.totalCanjes} {s.totalCanjes === 1 ? "canje" : "canjes"}</p>
                      </td>
                      <td><span className={`${styles.status} ${s.activo ? styles.active : styles.paused}`}>{s.activo ? "Activo" : "Pausado"}</span></td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" onClick={() => handleOpenAjuste(s)} className={styles.adjustButton}>Ajustar<span className="sr-only"> puntos de {s.nombre} {s.apellido || ""}</span></button>
                          <button type="button" onClick={() => handleOpenContacto(s)} className={styles.stateButton}>Correo<span className="sr-only"> de {s.nombre} {s.apellido || ""}</span></button>
                          <button type="button" onClick={() => handleToggleActivo(s)} className={styles.stateButton}>{s.activo ? "Pausar" : "Activar"}<span className="sr-only"> cuenta de {s.nombre} {s.apellido || ""}</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.mobile} aria-label="Socios registrados">
              {socios.map((s) => (
                <article key={s.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.name}>{s.nombre} {s.apellido || ""}</p>
                      <p className={styles.memberMeta}><span className={styles.memberNo}>{s.numeroSocio}</span><span aria-hidden="true">·</span>DNI {s.dni}</p>
                    </div>
                    <span className={`${styles.status} ${s.activo ? styles.active : styles.paused}`}>{s.activo ? "Activo" : "Pausado"}</span>
                  </div>
                  <div className={styles.cardStats}>
                    <div><p className={styles.cardLabel}>Puntos disponibles</p><p className={styles.pointsValue}>{s.puntosActuales.toLocaleString("es-AR")} <span>pts</span></p><p className={styles.muted}>Histórico: {s.puntosHistoricos.toLocaleString("es-AR")}</p></div>
                    <div><p className={styles.cardLabel}>Actividad</p><p className={styles.activityValue}>{s.totalVisitas} {s.totalVisitas === 1 ? "visita" : "visitas"}</p><p className={styles.muted}>{s.totalCanjes} {s.totalCanjes === 1 ? "canje" : "canjes"}</p></div>
                  </div>
                  {(s.email || s.telefono) && <p className={styles.cardContact}>{[s.email, s.telefono].filter(Boolean).join(" · ")}</p>}
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => handleOpenAjuste(s)} className={styles.adjustButton}>Ajustar puntos</button>
                    <button type="button" onClick={() => handleOpenContacto(s)} className={styles.stateButton}>Correo</button>
                    <button type="button" onClick={() => handleToggleActivo(s)} className={styles.stateButton}>{s.activo ? "Pausar cuenta" : "Activar cuenta"}</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="bg-[#070405] border-t border-[#5c131d]/20 px-4 py-3 flex items-center justify-between text-xs text-[#f5ede6]/60">
            <span>
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} socios)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSocios(pagination.page - 1, query)}
                className="p-1.5 rounded-lg bg-[#150c0e] hover:bg-[#1f1013] disabled:opacity-30 disabled:cursor-not-allowed text-[#f5ede6] border border-[#5c131d]/20 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSocios(pagination.page + 1, query)}
                className="p-1.5 rounded-lg bg-[#150c0e] hover:bg-[#1f1013] disabled:opacity-30 disabled:cursor-not-allowed text-[#f5ede6] border border-[#5c131d]/20 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalContacto && (
        <div className={styles.contactBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardandoCorreo) setModalContacto(null); }}>
          <div className={styles.contactDialog} role="dialog" aria-modal="true" aria-labelledby="contact-title">
            <div className={styles.contactHeader}>
              <div><h3 id="contact-title">Correo del socio</h3><p>{modalContacto.nombre} {modalContacto.apellido || ""} · {modalContacto.numeroSocio}</p></div>
              <button type="button" className={styles.contactClose} onClick={() => setModalContacto(null)} aria-label="Cerrar" disabled={guardandoCorreo}><X size={18} /></button>
            </div>
            <form className={styles.contactForm} onSubmit={handleGuardarCorreo}>
              <label htmlFor="correo-socio">Correo electrónico</label>
              <input id="correo-socio" type="email" required maxLength={254} autoComplete="email" value={correoContacto} onChange={(event) => setCorreoContacto(event.target.value)} placeholder="socio@correo.com" autoFocus disabled={guardandoCorreo} />
              <p>El socio recibirá aquí su código de ingreso. Confirmá la dirección con la persona antes de guardarla.</p>
              {errorCorreo && <p role="alert" className={styles.contactError}>{errorCorreo}</p>}
              <button type="submit" className={styles.contactSave} disabled={guardandoCorreo}>{guardandoCorreo ? "Guardando…" : "Guardar correo"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Manual de Puntos */}
      {modalSocio && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-black/90 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#d4aa58]" />
                <h3 className="text-base font-bold text-white font-serif">Ajuste Manual de Puntos</h3>
              </div>
              <button
                onClick={() => setModalSocio(null)}
                className="text-[#f5ede6]/40 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#050304] rounded-2xl p-3 border border-[#5c131d]/25 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">
                  {modalSocio.nombre} {modalSocio.apellido || ""}
                </p>
                <p className="text-[11px] font-mono text-[#f5ede6]/50">
                  {modalSocio.numeroSocio} • DNI: {modalSocio.dni}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-[#f5ede6]/40 font-medium">Saldo Actual</p>
                <p className="font-mono font-bold text-[#d4aa58] text-base">
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
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-[#150c0e] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/20"
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
                      ? "bg-[#5c131d] text-white shadow-md shadow-[#5c131d]/30"
                      : "bg-[#150c0e] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/20"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Debitar (-)</span>
                </button>
              </div>

              {/* Cantidad de Puntos */}
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Cantidad de Puntos *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={puntosAjuste}
                  onChange={(e) => setPuntosAjuste(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2.5 text-[#f5ede6] font-mono font-bold text-base focus:outline-none focus:border-[#5c131d]"
                />

                {/* Presets rápidos */}
                <div className="flex gap-1.5 mt-2">
                  {[25, 50, 100, 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPuntosAjuste(v)}
                      className="px-2.5 py-1 rounded-lg bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/80 font-mono text-[11px] border border-[#5c131d]/20 transition"
                    >
                      {v} pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo Obligatorio */}
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Motivo del ajuste (auditoría del administrador) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ej: Compensación por demora en cocina, carga manual de visita previa..."
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] placeholder-[#f5ede6]/30 focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5c131d]/20">
                <button
                  type="button"
                  disabled={guardandoAjuste}
                  onClick={() => setModalSocio(null)}
                  className="px-4 py-2 rounded-xl text-[#f5ede6]/50 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoAjuste}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg transition flex items-center gap-1.5 ${
                    tipoAjuste === "sumar"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-[#5c131d] hover:bg-[#731925] shadow-[#5c131d]/30"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-black/90 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#d4aa58] border border-[#5c131d]/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Registrar Nuevo Socio</h3>
                  <p className="text-[11px] text-[#f5ede6]/50">Padrón de Club La Encontrada</p>
                </div>
              </div>
              <button
                onClick={() => setModalNuevoSocio(false)}
                className="text-[#f5ede6]/40 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorNuevo && (
              <div className="p-3 bg-[#3a0b12]/60 border border-red-800/80 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorNuevo}</span>
              </div>
            )}

            <form onSubmit={handleCrearSocio} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* DNI */}
                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
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
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] font-mono text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 2914123456"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Nombre */}
                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carolina"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Gómez"
                    value={nuevoApellido}
                    onChange={(e) => setNuevoApellido(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              {/* Puntos Iniciales */}
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1 flex items-center justify-between">
                  <span>Puntos de Bienvenida Iniciales</span>
                  <span className="text-[10px] text-[#f5ede6]/40 font-normal">Opcional</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    value={nuevoPuntos}
                    onChange={(e) => setNuevoPuntos(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-28 bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] font-mono font-bold text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                  <div className="flex gap-1">
                    {[0, 50, 100, 200].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setNuevoPuntos(pts)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          nuevoPuntos === pts
                            ? "bg-[#5c131d] text-white font-bold border-[#5c131d]"
                            : "bg-[#150c0e] text-[#f5ede6]/60 hover:text-white border-[#5c131d]/20"
                        }`}
                      >
                        {pts} pts
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5c131d]/20">
                <button
                  type="button"
                  disabled={guardandoNuevo}
                  onClick={() => setModalNuevoSocio(false)}
                  className="px-4 py-2 rounded-xl text-[#f5ede6]/50 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoNuevo}
                  className="px-5 py-2 rounded-xl font-bold bg-[#5c131d] hover:bg-[#731925] text-white shadow-lg shadow-[#5c131d]/30 transition flex items-center gap-1.5"
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
