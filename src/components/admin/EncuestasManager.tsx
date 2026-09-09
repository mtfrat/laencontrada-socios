"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Sliders,
} from "lucide-react";

interface PreguntaItem {
  id: string;
  texto: string;
  categoria: string | null;
  activa: boolean;
  orden: number;
}

export default function EncuestasManager() {
  const [preguntas, setPreguntas] = useState<PreguntaItem[]>([]);
  const [puntosPorEncuesta, setPuntosPorEncuesta] = useState<number>(10);
  const [encuestaActiva, setEncuestaActiva] = useState<boolean>(true);
  const [encuestaUnaVezPorSocio, setEncuestaUnaVezPorSocio] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Nueva pregunta
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("COMIDA");
  const [creando, setCreando] = useState(false);

  // Editando pregunta existente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");
  const [editCategoria, setEditCategoria] = useState("COMIDA");

  // Guardando config
  const [savingConfig, setSavingConfig] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resP, resC] = await Promise.all([
        fetch("/api/admin/encuestas"),
        fetch("/api/admin/encuestas/config"),
      ]);
      const dataP = await resP.json();
      const dataC = await resC.json();

      if (dataP.success) setPreguntas(dataP.preguntas);
      if (dataC.success) {
        setPuntosPorEncuesta(dataC.config.puntosPorEncuesta);
        setEncuestaActiva(dataC.config.encuestaActiva);
        setEncuestaUnaVezPorSocio(dataC.config.encuestaUnaVezPorSocio);
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTexto.trim()) return;

    setCreando(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: nuevoTexto.trim(),
          categoria: nuevaCategoria,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPreguntas((prev) => [...prev, data.pregunta]);
        setNuevoTexto("");
        setToastMessage("¡Pregunta agregada a la encuesta de satisfacción!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "No se pudo agregar la pregunta.");
      }
    } catch {
      setErrorMessage("Error de red.");
    } finally {
      setCreando(false);
    }
  };

  const handleToggleActiva = async (pregunta: PreguntaItem) => {
    try {
      const res = await fetch(`/api/admin/encuestas/${pregunta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !pregunta.activa }),
      });
      const data = await res.json();
      if (data.success) {
        setPreguntas((prev) =>
          prev.map((p) => (p.id === pregunta.id ? { ...p, activa: !p.activa } : p))
        );
      }
    } catch {
      // Silencioso
    }
  };

  const startEdit = (p: PreguntaItem) => {
    setEditingId(p.id);
    setEditTexto(p.texto);
    setEditCategoria(p.categoria || "COMIDA");
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/encuestas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: editTexto, categoria: editCategoria }),
      });
      const data = await res.json();
      if (data.success) {
        setPreguntas((prev) =>
          prev.map((p) => (p.id === id ? { ...p, texto: editTexto, categoria: editCategoria } : p))
        );
        setEditingId(null);
        setToastMessage("Pregunta actualizada exitosamente.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      // Silencioso
    }
  };

  const handleDeletePregunta = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar o desactivar esta pregunta?")) return;

    try {
      const res = await fetch(`/api/admin/encuestas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      // Silencioso
    }
  };

  const handleSaveConfig = async (newConfig?: {
    puntos?: number;
    activa?: boolean;
    unaVez?: boolean;
  }) => {
    setSavingConfig(true);
    try {
      const body = {
        puntosPorEncuesta: newConfig?.puntos !== undefined ? newConfig.puntos : puntosPorEncuesta,
        encuestaActiva: newConfig?.activa !== undefined ? newConfig.activa : encuestaActiva,
        encuestaUnaVezPorSocio: newConfig?.unaVez !== undefined ? newConfig.unaVez : encuestaUnaVezPorSocio,
      };

      const res = await fetch("/api/admin/encuestas/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setPuntosPorEncuesta(data.config.puntosPorEncuesta);
        setEncuestaActiva(data.config.encuestaActiva);
        setEncuestaUnaVezPorSocio(data.config.encuestaUnaVezPorSocio);
        setToastMessage("¡Configuración de encuestas guardada exitosamente!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setErrorMessage("Error al guardar la configuración.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 bg-[#0d0708] border border-[#5c131d]/60 text-[#f5ede6] text-sm rounded-2xl flex items-center gap-3 shadow-2xl shadow-black/80">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[#3a0b12]/60 border border-red-800 text-red-200 text-sm rounded-2xl flex items-center gap-3 shadow-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PANEL DE CONTROL: MOSTRAR/OCULTAR, PUNTOS Y FRECUENCIA */}
      <div className="bg-[#0d0708] rounded-3xl p-6 border border-[#5c131d]/25 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#5c131d]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#5c131d]/15 text-[#d4aa58] border border-[#5c131d]/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Reglas y Visibilidad de Encuestas</h2>
              <p className="text-xs text-[#f5ede6]/50">Control maestro de puntos, frecuencia y visualización para socios.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Mostrar u Ocultar Todas las Encuestas */}
          <div className="bg-[#050304] p-4 rounded-2xl border border-[#5c131d]/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f5ede6]/50 block mb-1">
                Visibilidad General
              </span>
              <p className="text-sm font-bold text-white mb-2">
                {encuestaActiva ? "Encuestas Visibles" : "Encuestas Ocultas"}
              </p>
              <p className="text-[11px] text-[#f5ede6]/50 leading-relaxed">
                {encuestaActiva
                  ? "Los socios ven las encuestas en su cuenta para calificar y ganar puntos."
                  : "Módulo pausado: ningún socio verá ni podrá responder encuestas."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#5c131d]/20">
              <button
                type="button"
                onClick={() => {
                  const next = !encuestaActiva;
                  setEncuestaActiva(next);
                  handleSaveConfig({ activa: next });
                }}
                disabled={savingConfig}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  encuestaActiva
                    ? "bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60"
                    : "bg-[#150c0e] border border-[#5c131d]/25 text-[#f5ede6]/60 hover:text-white"
                }`}
              >
                {encuestaActiva ? (
                  <>
                    <Eye className="w-4 h-4 text-emerald-400" /> Mostrando en App
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-[#f5ede6]/40" /> Oculta en App
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Puntos Ganados por Completar */}
          <div className="bg-[#050304] p-4 rounded-2xl border border-[#5c131d]/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f5ede6]/50 block mb-1">
                Puntos de Recompensa
              </span>
              <p className="text-sm font-bold text-white mb-2">Bono por Encuesta</p>
              <p className="text-[11px] text-[#f5ede6]/50 leading-relaxed">
                Puntos exactos que se acreditarán automáticamente al socio al enviar sus respuestas.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#5c131d]/20 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#0d0708] border border-[#5c131d]/30 px-3 py-1.5 rounded-xl">
                <input
                  type="number"
                  min="0"
                  value={puntosPorEncuesta}
                  onChange={(e) => setPuntosPorEncuesta(Number(e.target.value))}
                  className="w-full bg-transparent text-[#d4aa58] font-mono font-bold text-lg focus:outline-none"
                />
                <span className="text-[10px] text-[#f5ede6]/50 font-semibold uppercase">pts</span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveConfig({ puntos: puntosPorEncuesta })}
                disabled={savingConfig}
                className="px-3.5 py-2 bg-[#5c131d] hover:bg-[#731925] text-white font-bold text-xs rounded-xl shadow-md shadow-[#5c131d]/30 transition shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* 3. Frecuencia Permitida (1 vez por socio vs 1 vez por visita) */}
          <div className="bg-[#050304] p-4 rounded-2xl border border-[#5c131d]/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f5ede6]/50 block mb-1">
                Frecuencia de Respuesta
              </span>
              <p className="text-sm font-bold text-white mb-2">
                {encuestaUnaVezPorSocio ? "Solo 1 vez por socio" : "1 vez por cada visita"}
              </p>
              <p className="text-[11px] text-[#f5ede6]/50 leading-relaxed">
                {encuestaUnaVezPorSocio
                  ? "Cada cliente solo puede calificar 1 sola vez en su vida como socio."
                  : "El cliente puede calificar cada una de sus visitas a comer y sumar puntos."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#5c131d]/20">
              <button
                type="button"
                onClick={() => {
                  const next = !encuestaUnaVezPorSocio;
                  setEncuestaUnaVezPorSocio(next);
                  handleSaveConfig({ unaVez: next });
                }}
                disabled={savingConfig}
                className="w-full py-2 px-3 bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/80 text-xs font-semibold rounded-xl border border-[#5c131d]/25 transition flex items-center justify-center gap-1.5"
              >
                Cambiar a: {encuestaUnaVezPorSocio ? "Por cada visita" : "1 sola vez por socio"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AGREGAR NUEVA PREGUNTA */}
      <div className="bg-[#0d0708] rounded-3xl p-6 border border-[#5c131d]/25 shadow-xl">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2 font-serif">
          <Plus className="w-4 h-4 text-[#d4aa58]" />
          Agregar Pregunta a la Encuesta
        </h3>
        <p className="text-xs text-[#f5ede6]/50 mb-4">
          Crea nuevas preguntas editables que aparecerán inmediatamente en el celular de los socios.
        </p>

        <form onSubmit={handleCreatePregunta} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Escribe la pregunta (ej: ¿Qué te pareció la temperatura y punto de la carne?)"
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#050304] border border-[#5c131d]/30 rounded-xl text-sm text-white placeholder:text-[#f5ede6]/30 focus:outline-none focus:border-[#5c131d] focus:ring-1 focus:ring-[#5c131d]/40"
            />
            <select
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="px-3.5 py-2.5 bg-[#050304] border border-[#5c131d]/30 rounded-xl text-xs text-[#f5ede6]/80 focus:outline-none focus:border-[#5c131d]"
            >
              <option value="COMIDA">Comida / Platos</option>
              <option value="ATENCION">Atención / Mozos</option>
              <option value="AMBIENTE">Ambiente / Clima</option>
              <option value="BEBIDAS">Bebidas / Vinos</option>
              <option value="GENERAL">General</option>
            </select>
            <button
              type="submit"
              disabled={creando || !nuevoTexto.trim()}
              className="px-5 py-2.5 bg-[#5c131d] hover:bg-[#731925] disabled:bg-[#150c0e] disabled:text-[#f5ede6]/30 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#5c131d]/30 transition shrink-0"
            >
              {creando ? "Agregando..." : "Crear Pregunta"}
            </button>
          </div>
        </form>
      </div>

      {/* LISTADO DE PREGUNTAS EDITABLES (MOSTRAR / OCULTAR CADA UNA) */}
      <div className="bg-[#0d0708] rounded-3xl p-6 border border-[#5c131d]/25 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#5c131d]/20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#f5ede6]/70 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#d4aa58]" />
            Preguntas en la Encuesta ({preguntas.length})
          </h3>
          <span className="text-xs text-[#f5ede6]/50">Pausa o activa cada una con 1 click</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#f5ede6]/50 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#5c131d]" />
            <span className="text-xs">Cargando preguntas...</span>
          </div>
        ) : preguntas.length === 0 ? (
          <p className="text-center py-8 text-[#f5ede6]/40 text-xs">
            No hay preguntas registradas. Crea una arriba para que los socios puedan calificar su experiencia.
          </p>
        ) : (
          <div className="space-y-2.5">
            {preguntas.map((p, idx) => (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  p.activa
                    ? "bg-[#050304] border-[#5c131d]/25"
                    : "bg-[#050304]/40 border-[#5c131d]/15 opacity-50"
                }`}
              >
                {editingId === p.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editTexto}
                      onChange={(e) => setEditTexto(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#0d0708] border border-[#5c131d]/30 rounded-xl text-xs text-white"
                    />
                    <select
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value)}
                      className="px-3 py-1.5 bg-[#0d0708] border border-[#5c131d]/30 rounded-xl text-xs text-[#f5ede6]/80"
                    >
                      <option value="COMIDA">Comida</option>
                      <option value="ATENCION">Atención</option>
                      <option value="AMBIENTE">Ambiente</option>
                      <option value="BEBIDAS">Bebidas</option>
                      <option value="GENERAL">General</option>
                    </select>
                    <button
                      onClick={() => handleSaveEdit(p.id)}
                      className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      title="Guardar"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg bg-[#150c0e] text-[#f5ede6]/50 hover:text-white"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#150c0e] text-[#d4aa58] border border-[#5c131d]/20 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.texto}</p>
                      <span className="text-[10px] font-mono text-[#d4aa58]/80 uppercase">
                        Categoría: {p.categoria || "GENERAL"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción rápida: Mostrar/Ocultar, Editar, Eliminar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActiva(p)}
                    className="flex items-center gap-1.5 text-xs text-[#f5ede6]/50 hover:text-white transition"
                    title={p.activa ? "Ocultar pregunta de la encuesta" : "Mostrar pregunta en la encuesta"}
                  >
                    {p.activa ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">Visible</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-[#f5ede6]/30" />
                        <span className="text-[11px] text-[#f5ede6]/40">Oculta</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="p-2 rounded-xl bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/25 transition"
                    title="Editar texto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePregunta(p.id)}
                    className="p-2 rounded-xl bg-[#150c0e] hover:bg-red-950/60 text-[#f5ede6]/60 hover:text-red-400 border border-[#5c131d]/25 transition"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
