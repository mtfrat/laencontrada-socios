"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Package,
  Layers,
  X,
  Save,
  Tag,
} from "lucide-react";

interface PremioItem {
  id: string;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  imagenUrl: string | null;
  stock: number;
  activo: boolean;
  totalCanjes: number;
  createdAt: string;
}

export default function PremiosManager() {
  const [premios, setPremios] = useState<PremioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntosRequeridos, setPuntosRequeridos] = useState(100);
  const [stock, setStock] = useState(-1); // -1 = ilimitado
  const [imagenUrl, setImagenUrl] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  // Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPremios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/premios");
      const data = await res.json();
      if (data.success) {
        setPremios(data.premios);
      } else {
        setErrorMessage(data.error || "No se pudo cargar el catálogo.");
      }
    } catch {
      setErrorMessage("Error de conexión al obtener premios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremios();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitulo("");
    setDescripcion("");
    setPuntosRequeridos(100);
    setStock(-1);
    setImagenUrl("");
    setActivo(true);
    setModalOpen(true);
  };

  const openEditModal = (p: PremioItem) => {
    setEditingId(p.id);
    setTitulo(p.titulo);
    setDescripcion(p.descripcion);
    setPuntosRequeridos(p.puntosRequeridos);
    setStock(p.stock);
    setImagenUrl(p.imagenUrl || "");
    setActivo(p.activo);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMessage("El título es obligatorio.");
      return;
    }
    if (puntosRequeridos <= 0) {
      setErrorMessage("Los puntos deben ser mayores a 0.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const url = editingId ? `/api/admin/premios/${editingId}` : "/api/admin/premios";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          puntosRequeridos,
          stock,
          imagenUrl: imagenUrl.trim() || null,
          activo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(editingId ? "¡Premio actualizado!" : "¡Nuevo premio creado!");
        setModalOpen(false);
        await fetchPremios();
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setErrorMessage(data.error || "Ocurrió un error al guardar.");
      }
    } catch {
      setErrorMessage("Error de red al guardar el premio.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (p: PremioItem) => {
    try {
      const res = await fetch(`/api/admin/premios/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !p.activo }),
      });
      const data = await res.json();
      if (data.success) {
        setPremios((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, activo: !p.activo } : item))
        );
        setToastMessage(`Premio "${p.titulo}" ${!p.activo ? "activado" : "pausado"}.`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setErrorMessage("No se pudo cambiar el estado del premio.");
    }
  };

  const handleDelete = async (p: PremioItem) => {
    if (!confirm(`¿Estás seguro de eliminar el premio "${p.titulo}"?`)) return;

    try {
      const res = await fetch(`/api/admin/premios/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message || "Premio eliminado.");
        await fetchPremios();
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setErrorMessage(data.error || "No se pudo eliminar.");
      }
    } catch {
      setErrorMessage("Error de conexión al eliminar.");
    }
  };

  const totalActivos = premios.filter((p) => p.activo).length;
  const totalCanjesHistoricos = premios.reduce((acc, curr) => acc + curr.totalCanjes, 0);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/60 border border-red-800/80 text-red-200 px-4 py-3 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards & Header Action */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-400">Premios Activos</p>
            <p className="text-3xl font-extrabold text-white font-mono mt-1">{totalActivos}</p>
            <p className="text-[11px] text-amber-400 mt-1">Disponibles para canje</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-400">Total en Catálogo</p>
            <p className="text-3xl font-extrabold text-stone-100 font-mono mt-1">{premios.length}</p>
            <p className="text-[11px] text-stone-400 mt-1">Incluye pausados</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-800 text-stone-300 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-400">Canjes Realizados</p>
            <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
              {totalCanjesHistoricos}
            </p>
            <p className="text-[11px] text-emerald-500/80 mt-1">Validados por mozos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Catálogo de Recompensas
          </h2>
          <p className="text-xs text-stone-400">
            Define los beneficios, costo en puntos, control de stock y visibilidad para los socios.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Premio</span>
        </button>
      </div>

      {/* Grid of Prizes */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
          <p className="text-sm">Cargando catálogo de recompensas...</p>
        </div>
      ) : premios.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-3xl p-12 text-center text-stone-400">
          <Gift className="w-12 h-12 mx-auto mb-3 text-stone-600" />
          <p className="font-semibold text-white">No hay premios configurados</p>
          <p className="text-xs text-stone-500 mt-1">
            Haz clic en "Nuevo Premio" para agregar la primera recompensa a la carta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {premios.map((p) => (
            <div
              key={p.id}
              className={`bg-stone-900 rounded-2xl p-5 border transition flex flex-col justify-between ${
                p.activo
                  ? "border-stone-800 hover:border-amber-500/40"
                  : "border-stone-800/50 opacity-60 bg-stone-950"
              }`}
            >
              <div>
                {/* Header card: points badge + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-sm border border-amber-500/30">
                      {p.puntosRequeridos.toLocaleString("es-AR")} pts
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.activo
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {p.activo ? "Activo" : "Pausado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActivo(p)}
                      title={p.activo ? "Pausar premio" : "Activar premio"}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
                    >
                      {p.activo ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-stone-500" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                      title="Editar premio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition"
                      title="Eliminar premio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{p.titulo}</h3>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">{p.descripcion}</p>
              </div>

              {/* Card Footer: Stock & Canjes */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-stone-500" />
                  <span>Stock:</span>
                  <span className="font-semibold text-stone-200">
                    {p.stock === -1
                      ? "Ilimitado"
                      : p.stock === 0
                      ? "Agotado (0)"
                      : `${p.stock} disponibles`}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-500">
                  {p.totalCanjes} canje{p.totalCanjes !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Alta / Edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? "Editar Premio" : "Nuevo Premio"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Título del Premio *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Postre de la Casa a elección"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Descripción o Condiciones
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Incluye flan casero, panqueque con dulce de leche o bocha de helado."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Puntos Requeridos *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={puntosRequeridos}
                    onChange={(e) => setPuntosRequeridos(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Stock (-1 = Ilimitado)
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto-premio.jpg"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="activoCheck" className="text-xs text-stone-300 cursor-pointer font-medium">
                  Premio visible y activo para canje inmediato
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white transition text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-xs"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingId ? "Guardar Cambios" : "Crear Premio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}