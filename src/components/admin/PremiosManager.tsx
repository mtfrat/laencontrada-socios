"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Package,
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
  const [imagenFile, setImagenFile] = useState<File | null>(null);
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
    // El estado inicial ya muestra la carga; los datos se actualizan al responder la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPremios();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitulo("");
    setDescripcion("");
    setPuntosRequeridos(100);
    setStock(-1);
    setImagenUrl("");
    setImagenFile(null);
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
    setImagenFile(null);
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
        const premioId = editingId || data.premio?.id;
        if (imagenFile && premioId) {
          const imageForm = new FormData();
          imageForm.set("imagen", imagenFile);
          const imageResponse = await fetch(`/api/admin/premios/${premioId}/imagen`, { method: "POST", body: imageForm });
          const imageResult = await imageResponse.json();
          if (!imageResponse.ok || !imageResult.success) {
            setEditingId(premioId);
            throw new Error(imageResult.error || "El premio se guardó, pero no se pudo cargar la imagen. Volvé a intentar.");
          }
        }
        setToastMessage(editingId ? "¡Premio actualizado!" : "¡Nuevo premio creado!");
        setModalOpen(false);
        await fetchPremios();
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setErrorMessage(data.error || "Ocurrió un error al guardar.");
      }
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Error de red al guardar el premio.");
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

      {/* El alta queda a la vista antes de las métricas. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#ce7281]" />
            Catálogo de premios
          </h2>
          <p className="text-sm text-stone-400">
            Agregá productos y definí sus puntos y disponibilidad.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="min-h-11 w-full bg-[#5c131d] hover:bg-[#7a1a27] text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shrink-0 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar premio</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-stone-800 py-4 sm:gap-4" aria-label="Resumen de premios">
        <div><p className="text-xs text-stone-400">Activos</p><p className="mt-1 font-mono text-2xl font-semibold text-white">{totalActivos}</p></div>
        <div><p className="text-xs text-stone-400">En catálogo</p><p className="mt-1 font-mono text-2xl font-semibold text-white">{premios.length}</p></div>
        <div><p className="text-xs text-stone-400">Canjes</p><p className="mt-1 font-mono text-2xl font-semibold text-[#d4aa58]">{totalCanjesHistoricos}</p></div>
      </div>

      {/* Grid of Prizes */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#ce7281]" />
          <p className="text-sm">Cargando catálogo de recompensas...</p>
        </div>
      ) : premios.length === 0 ? (
        <div className="bg-[#0d0708] border border-dashed border-stone-800 rounded-3xl p-12 text-center text-stone-400 shadow-lg">
          <Gift className="w-12 h-12 mx-auto mb-3 text-stone-600" />
          <p className="font-semibold text-white">No hay premios configurados</p>
          <p className="text-xs text-stone-500 mt-1">
            Usá &quot;Agregar premio&quot; para sumar el primer producto al catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {premios.map((p) => (
            <div
              key={p.id}
              className={`bg-[#0d0708] rounded-2xl p-5 border transition flex flex-col justify-between shadow-lg ${
                p.activo
                  ? "border-[#5c131d]/35 hover:border-[#5c131d]"
                  : "border-stone-800/50 opacity-60 bg-[#070405]"
              }`}
            >
              <div>
                {p.imagenUrl && <div className="relative mb-4 h-44 overflow-hidden rounded-xl bg-stone-900"><Image src={p.imagenUrl} alt={p.titulo} fill unoptimized className="object-cover" /></div>}
                {/* Header card: points badge + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#5c131d]/25 text-[#d4aa58] font-mono font-bold text-sm border border-[#5c131d]/40">
                      {p.puntosRequeridos.toLocaleString("es-AR")} pts
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.activo
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
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
                      aria-label={p.activo ? `Pausar ${p.titulo}` : `Activar ${p.titulo}`}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-400 hover:text-white transition"
                    >
                      {p.activo ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-stone-500" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-400 hover:text-[#ce7281] hover:bg-stone-900 transition"
                      title="Editar premio"
                      aria-label={`Editar ${p.titulo}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition"
                      title="Eliminar premio"
                      aria-label={`Eliminar ${p.titulo}`}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#ce7281]" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? "Editar Premio" : "Nuevo Premio"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar formulario de premio"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label htmlFor="premio-titulo" className="block text-sm font-medium text-stone-300 mb-1">
                  Nombre del premio *
                </label>
                <input
                  id="premio-titulo"
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Postre de la Casa a elección"
                  className="min-h-11 w-full rounded-xl border border-stone-700 bg-[#050304] px-3 py-2 text-base text-stone-100 focus:border-[#d4aa58] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="premio-descripcion" className="block text-sm font-medium text-stone-300 mb-1">
                  Descripción
                </label>
                <textarea
                  id="premio-descripcion"
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Incluye flan casero, panqueque con dulce de leche o bocha de helado."
                  className="w-full rounded-xl border border-stone-700 bg-[#050304] px-3 py-2 text-base text-stone-100 focus:border-[#d4aa58] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="premio-puntos" className="block text-sm font-medium text-stone-300 mb-1">
                    Puntos necesarios *
                  </label>
                  <input
                    id="premio-puntos"
                    type="number"
                    required
                    min={1}
                    value={puntosRequeridos}
                    onChange={(e) => setPuntosRequeridos(Math.max(1, parseInt(e.target.value) || 1))}
                    className="min-h-11 w-full rounded-xl border border-stone-700 bg-[#050304] px-3 py-2 font-mono text-base font-bold text-stone-100 focus:border-[#d4aa58] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="premio-stock" className="block text-sm font-medium text-stone-300 mb-1">
                    Stock
                  </label>
                  <input
                    id="premio-stock"
                    type="number"
                    min={0}
                    disabled={stock === -1}
                    value={stock === -1 ? "" : stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder={stock === -1 ? "Ilimitado" : "0"}
                    className="min-h-11 w-full rounded-xl border border-stone-700 bg-[#050304] px-3 py-2 font-mono text-base text-stone-100 focus:border-[#d4aa58] focus:outline-none disabled:text-stone-400"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-stone-300"><input type="checkbox" checked={stock === -1} onChange={(e) => setStock(e.target.checked ? -1 : 0)} className="size-4" />Stock ilimitado</label>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-stone-300 mb-1">Imagen del producto</span>
                {imagenUrl && <div className="relative mb-2 h-36 overflow-hidden rounded-xl bg-stone-900"><Image src={imagenUrl} alt="Imagen actual del premio" fill unoptimized className="object-cover" /></div>}
                <input id="imagen-premio" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImagenFile(event.target.files?.[0] || null)} className="peer sr-only" />
                <label htmlFor="imagen-premio" className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-stone-600 bg-[#150c0e] px-4 text-sm font-medium text-white hover:border-[#d4aa58] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#d4aa58]">Elegir imagen</label>
                <p className="mt-2 text-xs text-stone-400">{imagenFile ? imagenFile.name : "JPG, PNG o WebP · hasta 2 MB"}</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded bg-[#050304] border-stone-800 text-[#5c131d] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="activoCheck" className="text-sm text-stone-300 cursor-pointer font-medium">
                  Mostrar el premio a los socios
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-11 px-4 py-2 rounded-xl text-stone-300 hover:text-white transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-11 bg-[#5c131d] hover:bg-[#7a1a27] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingId ? "Guardar cambios" : "Crear premio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
