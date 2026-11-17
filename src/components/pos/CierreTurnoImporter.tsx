"use client";

import { useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, FileUp, Loader2, Users } from "lucide-react";
import { calculateTablePoints } from "@/lib/points-engine";
import { normalizeSocioNumber } from "@/lib/socio-number";
import styles from "./CierreTurnoImporter.module.css";

interface Ticket {
  mesa: string;
  numeroFactura: string;
  monto: number;
  yaAcreditado: boolean;
}

interface Preview {
  pesosPorPunto: number;
  cierre: {
    fecha: string;
    turnoNombre: string;
    cierreNumero: string;
    totalVentas: number;
    cantidadFacturas: number;
    tickets: Ticket[];
  };
}

interface Assignment {
  numeroFactura: string;
  comensales: number;
  numerosSocio: string[];
}

interface RowState { comensales: string; socios: string }
interface ResolvedSocio { numeroSocio: string; nombre: string; apellido: string | null }

function parseNumbers(value: string): string[] {
  return value.split(/[\s,;]+/).map(normalizeSocioNumber).filter(Boolean);
}

export default function CierreTurnoImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [reviewed, setReviewed] = useState<Assignment[] | null>(null);
  const [resolved, setResolved] = useState<ResolvedSocio[]>([]);
  const [busy, setBusy] = useState<"preview" | "review" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ mesasAcreditadas: number; sociosAcreditados: number } | null>(null);

  const loadFile = async (file: File | null) => {
    setArchivo(file);
    setPreview(null);
    setRows({});
    setReviewed(null);
    setResolved([]);
    setDone(null);
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 5 * 1024 * 1024) {
      setError("Seleccioná un PDF de hasta 5 MB.");
      return;
    }
    setBusy("preview");
    try {
      const body = new FormData();
      body.set("archivo", file);
      const response = await fetch("/api/pos/cierre/preview", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo leer el cierre.");
      setPreview(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo leer el PDF.");
    } finally {
      setBusy(null);
    }
  };

  const updateRow = (factura: string, field: keyof RowState, value: string) => {
    setRows((current) => ({
      ...current,
      [factura]: { comensales: current[factura]?.comensales ?? "", socios: current[factura]?.socios ?? "", [field]: value },
    }));
    setReviewed(null);
    setResolved([]);
    setError(null);
  };

  const review = async () => {
    if (!preview) return;
    const assignments: Assignment[] = [];
    const used = new Set<string>();
    for (const ticket of preview.cierre.tickets) {
      if (ticket.yaAcreditado) continue;
      const row = rows[ticket.numeroFactura];
      const numerosSocio = parseNumbers(row?.socios ?? "");
      if (numerosSocio.length === 0) continue;
      const comensales = Number(row?.comensales);
      if (!Number.isInteger(comensales) || comensales < 1 || comensales > 30 || numerosSocio.length > comensales) {
        setError(`Indicá los comensales de la mesa ${ticket.mesa}. Deben ser al menos tantos como los socios seleccionados.`);
        return;
      }
      if (new Set(numerosSocio).size !== numerosSocio.length || numerosSocio.some((numero) => used.has(numero))) {
        setError(`Hay un número de socio repetido en el cierre. Revisá la mesa ${ticket.mesa}.`);
        return;
      }
      numerosSocio.forEach((numero) => used.add(numero));
      const { puntosPorSocio } = calculateTablePoints({ totalTicket: ticket.monto, guestCount: comensales, pesosPorPunto: preview.pesosPorPunto });
      if (puntosPorSocio < 1) {
        setError(`La mesa ${ticket.mesa} no alcanza para sumar un punto por persona con la equivalencia actual.`);
        return;
      }
      assignments.push({ numeroFactura: ticket.numeroFactura, comensales, numerosSocio });
    }
    if (assignments.length === 0) {
      setError("Ingresá al menos un número de socio en una factura pendiente.");
      return;
    }
    setBusy("review");
    setError(null);
    try {
      const response = await fetch("/api/pos/cierre/validar-socios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numerosSocio: [...used] }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudieron validar los socios.");
      if (data.noEncontrados.length > 0) throw new Error(`No encontramos estos socios activos: ${data.noEncontrados.join(", ")}.`);
      setResolved(data.socios);
      setReviewed(assignments);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron validar los socios.");
    } finally {
      setBusy(null);
    }
  };

  const commit = async () => {
    if (!archivo || !preview || !reviewed || busy) return;
    setBusy("commit");
    setError(null);
    try {
      const body = new FormData();
      body.set("archivo", archivo);
      body.set("asignaciones", JSON.stringify({ pesosPorPunto: preview.pesosPorPunto, asignaciones: reviewed }));
      const response = await fetch("/api/pos/cierre/acreditar", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo acreditar el cierre.");
      setDone({ mesasAcreditadas: data.mesasAcreditadas, sociosAcreditados: data.sociosAcreditados });
      setReviewed(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo acreditar el cierre.");
    } finally {
      setBusy(null);
    }
  };

  const resolvedByNumber = new Map(resolved.map((socio) => [socio.numeroSocio.toUpperCase(), socio]));

  return <section className={`${styles.section} space-y-6`} aria-labelledby="cierre-title">
    <div className={styles.heading}>
      <div className={styles.headingIcon}><FileUp size={23} aria-hidden="true" /></div>
      <div>
        <p className={styles.eyebrow}>PASO 1 · IMPORTACIÓN</p>
        <h2 id="cierre-title" className={styles.title}>Subir archivo</h2>
        <p className={styles.subtitle}>Seleccioná el cierre de Maxirest en PDF para detectar las facturas.</p>
      </div>
    </div>

    <ol className={styles.steps} aria-label="Pasos para acreditar un cierre">
      <li className={styles.currentStep}><span>1</span>Subir el PDF</li>
      <li className={preview ? styles.currentStep : ""}><span>2</span>Revisar mesas</li>
      <li className={reviewed || done ? styles.currentStep : ""}><span>3</span>Acreditar puntos</li>
    </ol>

    <div className={styles.upload}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        aria-label="Archivo PDF del cierre de turno"
        tabIndex={-1}
        className={styles.fileInput}
        onChange={(event) => {
          void loadFile(event.currentTarget.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
        disabled={Boolean(busy)}
      />
      <div className={styles.uploadIcon}><FileUp size={27} strokeWidth={1.5} aria-hidden="true" /></div>
      <div className={styles.uploadCopy}>
        <h3>{archivo ? archivo.name : "Elegí el archivo PDF"}</h3>
        <p>{archivo ? `${(archivo.size / (1024 * 1024)).toFixed(2)} MB · archivo PDF` : "Cierre de Maxirest · hasta 5 MB"}</p>
      </div>
      <button type="button" className={styles.selectButton} onClick={() => fileInputRef.current?.click()} disabled={Boolean(busy)}>
        {archivo ? "Cambiar PDF" : "Seleccionar PDF"}<ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
    <p className={styles.note}>Al subirlo, primero vas a revisar las facturas y los socios. Los puntos se acreditan solo después de tu confirmación.</p>
    {busy === "preview" && <p role="status" className={styles.loading}><Loader2 className="animate-spin" size={18} /> Leyendo facturas…</p>}
    {error && <p role="alert" className={styles.error}><AlertCircle size={18} className="shrink-0" />{error}</p>}
    {error && archivo && !busy && <button type="button" className={styles.retryButton} onClick={() => void loadFile(archivo)}>Volver a comprobar PDF</button>}
    {done && <div role="status" className={styles.done}><CheckCircle2 size={24} /><h3>Cierre acreditado</h3><p>{done.mesasAcreditadas} mesas y {done.sociosAcreditados} socios recibieron puntos. Las facturas quedan marcadas para evitar una segunda acreditación.</p></div>}

    {preview && !done && <>
      <div className={styles.previewSummary}>
        <p className="font-semibold">Cierre {preview.cierre.cierreNumero} · {preview.cierre.fecha} · {preview.cierre.turnoNombre}</p>
        <p className="text-stone-400 mt-1">{preview.cierre.cantidadFacturas} facturas · ${preview.cierre.totalVentas.toLocaleString("es-AR")} facturados · ${preview.pesosPorPunto.toLocaleString("es-AR")} = 1 punto</p>
        <p className="text-xs text-[#d4aa58] mt-3">El PDF no informa los cubiertos de cada factura con fiabilidad. Completá los comensales; el monto se divide entre todos, aunque solo haya un socio.</p>
      </div>
      <div className="space-y-3">
        {preview.cierre.tickets.map((ticket) => {
          const row = rows[ticket.numeroFactura];
          const comensales = Number(row?.comensales);
          const numeros = parseNumbers(row?.socios ?? "");
          const points = Number.isInteger(comensales) && comensales > 0
            ? calculateTablePoints({ totalTicket: ticket.monto, guestCount: comensales, pesosPorPunto: preview.pesosPorPunto }).puntosPorSocio : null;
          return <div key={ticket.numeroFactura} className={`${styles.ticket} ${ticket.yaAcreditado ? styles.ticketComplete : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-white">Mesa {ticket.mesa}</h3><p className="text-xs text-stone-400">Factura {ticket.numeroFactura}</p></div><strong className="font-mono text-[#d4aa58]">${ticket.monto.toLocaleString("es-AR")}</strong></div>
            {ticket.yaAcreditado ? <p className="mt-3 text-sm text-emerald-300">Esta factura ya recibió puntos.</p> : <div className="grid gap-3 sm:grid-cols-[140px_1fr] mt-4">
              <label className="text-xs text-stone-300">Comensales en mesa<input type="number" min="1" max="30" inputMode="numeric" value={row?.comensales ?? ""} onChange={(event) => updateRow(ticket.numeroFactura, "comensales", event.target.value)} className="mt-1 block w-full min-h-11 rounded-xl border border-stone-700 bg-[#050304] px-3 text-white" placeholder="Ej. 4" /></label>
              <label className="text-xs text-stone-300">Números de socio presentes<input type="text" value={row?.socios ?? ""} onChange={(event) => updateRow(ticket.numeroFactura, "socios", event.target.value)} className="mt-1 block w-full min-h-11 rounded-xl border border-stone-700 bg-[#050304] px-3 text-white" placeholder="SOC-1001, SOC-1002 · dejá vacío si no hay socios" /></label>
              <p className="sm:col-span-2 text-xs text-stone-400 flex items-center gap-1"><Users size={14} />{points === null ? "Completá comensales para ver los puntos." : `${points} puntos para cada socio seleccionado (${numeros.length} socios).`}</p>
              {reviewed && numeros.length > 0 && <p className="sm:col-span-2 text-xs text-emerald-200">{numeros.map((numero) => { const socio = resolvedByNumber.get(numero); return socio ? `${socio.nombre} ${socio.apellido ?? ""} (${numero})` : numero; }).join(" · ")}</p>}
            </div>}
          </div>;
        })}
      </div>
      <div className={`${styles.reviewPanel} space-y-3`}>
        <p className="text-xs text-stone-300">Las facturas sin socios quedan sin acreditar. Revisá los nombres antes de confirmar; una factura acreditada no puede repetirse desde este cierre.</p>
        {!reviewed ? <button type="button" onClick={() => void review()} disabled={Boolean(busy)} className={styles.reviewButton}>{busy === "review" ? "Validando socios…" : "Revisar socios y puntos"}</button> : <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-emerald-300">Listo: {reviewed.length} facturas, {reviewed.reduce((sum, row) => sum + row.numerosSocio.length, 0)} socios.</span><button type="button" onClick={() => void commit()} disabled={Boolean(busy)} className={styles.reviewButton}>{busy === "commit" ? "Acreditando…" : "Confirmar y acreditar puntos"}</button></div>}
      </div>
    </>}
  </section>;
}
