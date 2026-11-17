"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Mensaje = {
  id: string;
  autorId: string | null;
  autorNombre: string;
  contenido: string;
  createdAt: string;
};

export default function StaffChat({ usuarioId }: { usuarioId: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/chat", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo cargar el chat.");
      setMensajes(data.mensajes);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el chat.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => { void cargar(); }, 0);
    const timer = window.setInterval(() => {
      if (!document.hidden) void cargar();
    }, 5000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [cargar]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [mensajes.length]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contenido.trim() || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo enviar el mensaje.");
      setContenido("");
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#5c131d]/40 bg-[#0d0708] overflow-hidden shadow-2xl">
      <div className="px-5 py-3 border-b border-[#5c131d]/30 text-xs text-stone-400">Conversación del equipo · Se actualiza cada 5 segundos</div>
      <div ref={listRef} aria-live="polite" aria-label="Mensajes del equipo" className="h-[min(60vh,560px)] overflow-y-auto p-4 sm:p-6 space-y-3">
        {cargando && <p className="text-center text-stone-400 text-sm">Cargando mensajes...</p>}
        {!cargando && mensajes.length === 0 && <p className="text-center text-stone-400 text-sm">Todavía no hay mensajes. Iniciá la conversación.</p>}
        {mensajes.map((mensaje) => {
          const propio = mensaje.autorId === usuarioId;
          return (
            <div key={mensaje.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
              <article className={`max-w-[85%] rounded-2xl px-4 py-3 ${propio ? "bg-[#5c131d] text-white" : "bg-stone-900 text-stone-100"}`}>
                <div className="flex items-baseline justify-between gap-4 text-[11px]">
                  <strong className="truncate">{propio ? "Vos" : mensaje.autorNombre}</strong>
                  <time className="opacity-60 shrink-0" dateTime={mensaje.createdAt}>{new Date(mensaje.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words mt-1">{mensaje.contenido}</p>
              </article>
            </div>
          );
        })}
      </div>
      <form onSubmit={enviar} className="border-t border-[#5c131d]/30 p-3 sm:p-4 flex items-end gap-2">
        <label htmlFor="mensaje-interno" className="sr-only">Mensaje</label>
        <textarea id="mensaje-interno" value={contenido} onChange={(event) => setContenido(event.target.value)} maxLength={2000} rows={2} placeholder="Escribí al equipo..." className="flex-1 resize-none rounded-xl bg-[#050304] border border-stone-700 p-3 text-sm text-white focus:outline-none focus:border-[#d4aa58]" />
        <button type="submit" disabled={enviando || !contenido.trim()} className="rounded-xl bg-[#5c131d] hover:bg-[#7a1a27] disabled:opacity-50 p-3 text-white" aria-label="Enviar mensaje"><Send className="w-5 h-5" /></button>
      </form>
      {error && <p role="alert" className="px-4 pb-3 text-red-300 text-sm">{error}</p>}
    </section>
  );
}
