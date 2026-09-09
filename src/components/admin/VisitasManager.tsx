"use client";

import { useState, useEffect } from "react";
import {
  Utensils,
  Receipt,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

interface PlatoItem {
  nombrePlato: string;
  cantidad: number;
  notas?: string;
}

interface VisitaItem {
  id: string;
  socioId: string;
  socio: {
    id: string;
    nombre: string;
    apellido?: string | null;
    dni: string;
    numeroSocio: string;
  };
  registradoPor?: {
    id: string;
    nombre: string;
    username: string;
  } | null;
  fechaVisita: string;
  franjaHoraria: "ALMUERZO" | "CENA" | "TARDE" | "OTRO";
  montoTotalTicket: number;
  cantidadComensales: number;
  gastoPromedioPorPersona: number;
  puntosAcreditados: number;
  notas?: string | null;
  platos: Array<{
    id: string;
    nombrePlato: string;
    cantidad: number;
    notas?: string | null;
  }>;
  ticketAdjunto?: {
    id: string;
    urlArchivo?: string | null;
    numeroTicketFiscal?: string | null;
  } | null;
}

const PLATOS_SUGERIDOS = [
  "Ojo de bife",
  "Bife de chorizo",
  "Asado de tira",
  "Vacío a la parrilla",
  "Provoleta clásica",
  "Empanada de carne cortada a cuchillo",
  "Papas fritas rústicas",
  "Ensalada mixta",
  "Vino Malbec Reserva",
  "Vino Cabernet Sauvignon",
  "Agua con / sin gas",
  "Postre: Flan casero mixto",
  "Postre: Panqueque con dulce de leche",
];

export default function VisitasManager() {
  const [visitas, setVisitas] = useState<VisitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisita, setSelectedVisita] = useState<VisitaItem | null>(null);

  // Formulario modal de edición
  const [editFranja, setEditFranja] = useState<"ALMUERZO" | "CENA" | "TARDE" | "OTRO">("CENA");
  const [editFecha, setEditFecha] = useState<string>("");
  const [editNotas, setEditNotas] = useState<string>("");
  const [editPlatos, setEditPlatos] = useState<PlatoItem[]>([]);
  const [editTicketFiscal, setEditTicketFiscal] = useState<string>("");
  const [editUrlArchivo, setEditUrlArchivo] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVisitas = async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
      const res = await fetch(`/api/visitas${q}`);
      const data = await res.json();
      if (data.success) {
        setVisitas(data.visitas);
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, [searchQuery]);

  const openEditModal = (visita: VisitaItem) => {
    setSelectedVisita(visita);
    setEditFranja(visita.franjaHoraria);
    setEditFecha(new Date(visita.fechaVisita).toISOString().slice(0, 16));
    setEditNotas(visita.notas || "");
    setEditPlatos(
      visita.platos.length > 0
        ? visita.platos.map((p) => ({
            nombrePlato: p.nombrePlato,
            cantidad: p.cantidad,
            notas: p.notas || "",
          }))
        : []
    );
    setEditTicketFiscal(visita.ticketAdjunto?.numeroTicketFiscal || "");
    setEditUrlArchivo(visita.ticketAdjunto?.urlArchivo || "");
    setErrorMessage(null);
  };

  const closeEditModal = () => {
    setSelectedVisita(null);
    setErrorMessage(null);
  };

  const handleAddPlato = (nombre: string = "") => {
    setEditPlatos((prev) => [...prev, { nombrePlato: nombre, cantidad: 1, notas: "" }]);
  };

  const handleRemovePlato = (index: number) => {
    setEditPlatos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlatoChange = (index: number, field: keyof PlatoItem, value: any) => {
    setEditPlatos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisita) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/visitas/${selectedVisita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franjaHoraria: editFranja,
          fechaVisita: editFecha ? new Date(editFecha).toISOString() : undefined,
          notas: editNotas,
          platos: editPlatos.filter((p) => p.nombrePlato.trim().length > 0),
          numeroTicketFiscal: editTicketFiscal,
          urlArchivo: editUrlArchivo,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "No se pudo guardar la información.");
        setSaving(false);
        return;
      }

      // Actualizar lista local
      setVisitas((prev) =>
        prev.map((v) => (v.id === selectedVisita.id ? data.visita : v))
      );

      setToastMessage("¡Historial gastronómico y visita actualizados exitosamente!");
      setTimeout(() => setToastMessage(null), 4000);
      closeEditModal();
    } catch {
      setErrorMessage("Error de red al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm rounded-2xl flex items-center gap-3 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search and Filters Header */}
      <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por DNI o Nombre del socio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-stone-400">
          <span>Total registradas:</span>
          <span className="font-mono font-bold text-amber-400 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
            {visitas.length}
          </span>
        </div>
      </div>

      {/* Visits List */}
      {loading ? (
        <div className="text-center py-16 text-stone-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Cargando historial de visitas gastronómicas...</p>
        </div>
      ) : visitas.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800 text-stone-400">
          <Utensils className="w-10 h-10 mx-auto text-stone-600 mb-3" />
          <p className="text-base font-semibold text-stone-300">No hay visitas registradas aún</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            A medida que los mozos carguen consumos de mesas en la terminal, aparecerán aquí para detallar platos y asociar tickets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visitas.map((visita) => (
            <div
              key={visita.id}
              className="bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-800 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between gap-4"
            >
              {/* Card Top: Socio & Turno */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {visita.socio.nombre} {visita.socio.apellido || ""}
                      <span className="text-xs font-mono font-normal text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        DNI: {visita.socio.dni}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-400">
                      Socio {visita.socio.numeroSocio} • Atendido por: {visita.registradoPor?.nombre || "Personal"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {visita.franjaHoraria}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {new Date(visita.fechaVisita).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Card Middle: Consumption Metrics & Dishes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Economic Metrics */}
                <div className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Total Ticket:</span>
                    <span className="font-mono font-bold text-white">
                      ${Number(visita.montoTotalTicket).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Comensales:</span>
                    <span className="font-mono text-stone-300">
                      {visita.cantidadComensales} personas
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
                    <span className="text-stone-400">Gasto Individual:</span>
                    <span className="font-mono font-bold text-amber-400">
                      ${Number(visita.gastoPromedioPorPersona).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-400">Puntos sumados:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{visita.puntosAcreditados} pts
                    </span>
                  </div>
                </div>

                {/* Gastronomic Dishes Preview */}
                <div className="lg:col-span-2 bg-stone-950/80 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-500" />
                        Platos Consumidos ({visita.platos.length})
                      </span>
                      {visita.ticketAdjunto?.numeroTicketFiscal && (
                        <span className="text-[11px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
                          Ticket: #{visita.ticketAdjunto.numeroTicketFiscal}
                        </span>
                      )}
                    </div>

                    {visita.platos.length === 0 ? (
                      <p className="text-xs text-stone-500 italic">
                        Sin platos cargados aún. Haz clic en "Detallar Platos" para registrar qué comió el cliente.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {visita.platos.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-stone-800 text-stone-200 px-2.5 py-1 rounded-lg border border-stone-700"
                          >
                            <span className="font-bold text-amber-400">{p.cantidad}x</span>
                            <span>{p.nombrePlato}</span>
                            {p.notas && <span className="text-stone-400 text-[10px]">({p.notas})</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {visita.notas ? `Notas: ${visita.notas}` : "Sin observaciones adicionales"}
                    </span>
                    <button
                      onClick={() => openEditModal(visita)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {visita.platos.length > 0 ? "Editar Platos / Ticket" : "Detallar Platos y Ticket"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDICIÓN DIFERIDA (TIEMPO 2) */}
      {selectedVisita && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 rounded-3xl border border-stone-700 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  Detalle Gastronómico de la Visita
                </h3>
                <p className="text-xs text-stone-400">
                  Socio: {selectedVisita.socio.nombre} {selectedVisita.socio.apellido || ""} (DNI: {selectedVisita.socio.dni})
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveVisita} className="p-6 space-y-6 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Fecha y Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-300 mb-1.5">
                    Turno / Franja Horaria
                  </label>
                  <select
                    value={editFranja}
                    onChange={(e) => setEditFranja(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALMUERZO">ALMUERZO</option>
                    <option value="CENA">CENA</option>
                    <option value="TARDE">TARDE</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-300 mb-1.5">
                    Fecha y Hora de la Visita
                  </label>
                  <input
                    type="datetime-local"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* SECCIÓN PLATOS CONSUMIDOS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase text-stone-300 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    Platos Consumidos por la Mesa
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPlato("")}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Plato
                  </button>
                </div>

                {/* Sugerencias rápidas de 1 click */}
                <div className="mb-3">
                  <p className="text-[11px] text-stone-400 mb-1.5">Sugerencias frecuentes (click para agregar):</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {PLATOS_SUGERIDOS.map((plato) => (
                      <button
                        key={plato}
                        type="button"
                        onClick={() => handleAddPlato(plato)}
                        className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded-md border border-stone-700 transition"
                      >
                        + {plato}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de platos editables */}
                {editPlatos.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-500">
                    No has agregado ningún plato aún. Usa las sugerencias de arriba o el botón "Agregar Plato".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editPlatos.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-950 rounded-2xl border border-stone-800 flex items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          placeholder="Nombre del plato (ej: Ojo de bife)"
                          value={p.nombrePlato}
                          onChange={(e) => handlePlatoChange(idx, "nombrePlato", e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-stone-400">Cant:</span>
                          <input
                            type="number"
                            min="1"
                            value={p.cantidad}
                            onChange={(e) => handlePlatoChange(idx, "cantidad", Number(e.target.value))}
                            className="w-12 px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-center text-white font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Notas (opcional)"
                          value={p.notas || ""}
                          onChange={(e) => handlePlatoChange(idx, "notas", e.target.value)}
                          className="w-32 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-300 placeholder:text-stone-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePlato(idx)}
                          className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-red-900/60 text-stone-400 hover:text-red-300 flex items-center justify-center transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN COMPROBANTE / TICKET FISCAL */}
              <div className="pt-4 border-t border-stone-800 space-y-3">
                <label className="block text-xs font-semibold uppercase text-stone-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  Asociación de Ticket o Comprobante Fiscal
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-stone-400 block mb-1">
                      Número de Ticket / Factura:
                    </span>
                    <input
                      type="text"
                      placeholder="Ej: FAC-A-0001-00023412"
                      value={editTicketFiscal}
                      onChange={(e) => setEditTicketFiscal(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 block mb-1">
                      Foto o Enlace del Ticket:
                    </span>
                    <input
                      type="text"
                      placeholder="Ej: https://... o ruta de foto"
                      value={editUrlArchivo}
                      onChange={(e) => setEditUrlArchivo(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones generales */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                  Notas Generales de la Mesa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mesa VIP en terraza, comieron postre de cortesía"
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Guardar Información Gastronómica
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
