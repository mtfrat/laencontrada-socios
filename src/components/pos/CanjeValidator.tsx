"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  X,
  Camera,
  CameraOff,
  Keyboard,
} from "lucide-react";
import styles from "./CanjeValidator.module.css";

interface ValidacionResult {
  id: string;
  codigoQR: string;
  premio: string;
  puntosDebitado: number;
  socio: {
    nombre: string;
    dni: string;
    nuevoSaldo: number;
  };
  fechaCanje: string;
  validadoPor: string;
}

const scannerCleanup = new WeakMap<Html5Qrcode, Promise<void>>();

function releaseScanner(scanner: Html5Qrcode) {
  const pending = scannerCleanup.get(scanner);
  if (pending) return pending;
  const cleanup = (async () => {
    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch (error) {
      console.error("Error cerrando cámara:", error);
    }
  })();
  scannerCleanup.set(scanner, cleanup);
  return cleanup;
}

export default function CanjeValidator() {
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState<ValidacionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActiva, setCameraActiva] = useState(false);
  const [iniciandoCamara, setIniciandoCamara] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const procesarValidacion = useCallback(async (codigoAValidar: string) => {
    if (!codigoAValidar || !codigoAValidar.trim()) {
      setErrorMessage("Ingresá o escaneá el código del cupón.");
      return;
    }

    setValidando(true);
    setErrorMessage(null);
    setCameraError(null);

    try {
      const res = await fetch("/api/pos/canje/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoAValidar.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setResultado(data.canje);
        setCodigo("");
      } else {
        setErrorMessage(data.error || "No se pudo validar el cupón.");
      }
    } catch {
      setErrorMessage("Error de conexión al validar el cupón.");
    } finally {
      setValidando(false);
    }
  }, []);

  const handleValidarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procesarValidacion(codigo);
  };

  const stopCamera = useCallback(async () => {
    setCameraActiva(false);
    setIniciandoCamara(false);
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    if (scanner?.isScanning) await releaseScanner(scanner);
  }, []);

  const startCamera = () => {
    setErrorMessage(null);
    setCameraError(null);
    setIniciandoCamara(true);
    setCameraActiva(true);
  };

  // El lector se crea después de que React montó el contenedor de cámara.
  useEffect(() => {
    if (!cameraActiva) return;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    let started = false;
    const open = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode("qr-reader-target");
        html5QrCodeRef.current = scanner;
        await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              aspectRatio: 1.0,
            },
            async (decodedText: string) => {
              if (cancelled) return;
              if (typeof window !== "undefined" && window.navigator && "vibrate" in window.navigator) {
                try {
                  window.navigator.vibrate(120);
                } catch {
                  // Silencioso
                }
              }

              await stopCamera();
              setCodigo(decodedText);
              await procesarValidacion(decodedText);
            },
            () => {
              // Frame sin QR: continuar escaneando
            }
        );
        started = true;
        if (cancelled) {
          await releaseScanner(scanner);
          return;
        }
        setIniciandoCamara(false);
      } catch (error) {
        if (cancelled) {
          if (scanner) await releaseScanner(scanner);
          return;
        }
        console.error("Error iniciando cámara:", error);
        setCameraError("No se pudo acceder a la cámara. Revisá los permisos del navegador o ingresá el código manualmente.");
        setCameraActiva(false);
        setIniciandoCamara(false);
      }
    };
    void open();
    return () => {
      cancelled = true;
      if (scanner && started) void releaseScanner(scanner);
      if (html5QrCodeRef.current === scanner) html5QrCodeRef.current = null;
    };
  }, [cameraActiva, procesarValidacion, stopCamera]);

  const handleReset = () => {
    setResultado(null);
    setCodigo("");
    setErrorMessage(null);
    setCameraError(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <section className={styles.validator} aria-labelledby="validator-title">
      <header className={styles.header}>
        <div className={styles.headerIcon}><QrCode size={23} aria-hidden="true" /></div>
        <div>
          <p className={styles.eyebrow}>ENTREGA DE PREMIOS</p>
          <h2 id="validator-title" className={styles.title}>Validar cupón</h2>
          <p className={styles.subtitle}>Confirmá el código antes de entregar el premio al socio.</p>
        </div>
      </header>

      {resultado ? (
        <div className={styles.success} role="status">
          <div className={styles.successIcon}><CheckCircle2 size={30} aria-hidden="true" /></div>
          <div>
            <p className={styles.successEyebrow}>CANJE APROBADO</p>
            <h3>Entregá: {resultado.premio}</h3>
            <p>Se debitaron {resultado.puntosDebitado} puntos del saldo del socio.</p>
          </div>
          <dl className={styles.details}>
            <div><dt>Socio</dt><dd>{resultado.socio.nombre}</dd></div>
            <div><dt>DNI</dt><dd>{resultado.socio.dni}</dd></div>
            <div><dt>Código validado</dt><dd>{resultado.codigoQR}</dd></div>
            <div><dt>Nuevo saldo</dt><dd>{resultado.socio.nuevoSaldo} pts</dd></div>
          </dl>
          <button type="button" className={styles.primaryButton} onClick={handleReset}><RotateCcw size={17} aria-hidden="true" />Validar otro cupón</button>
        </div>
      ) : (
        <>
          {errorMessage && <div className={styles.error} role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{errorMessage}</p><button type="button" onClick={() => setErrorMessage(null)} aria-label="Cerrar aviso"><X size={17} /></button></div>}
          {cameraError && <div className={styles.error} role="alert"><CameraOff size={18} aria-hidden="true" /><p>{cameraError}</p><button type="button" onClick={() => setCameraError(null)} aria-label="Cerrar aviso de cámara"><X size={17} /></button></div>}

          {cameraActiva ? (
            <div className={styles.cameraView}>
              <div className={styles.readerFrame}>
                <div id="qr-reader-target" className={styles.readerTarget} />
                {iniciandoCamara && <div className={styles.readerOverlay}><Loader2 className="animate-spin" size={28} /><span>Iniciando cámara…</span></div>}
                {validando && <div className={styles.readerOverlay}><Loader2 className="animate-spin" size={28} /><span>Validando cupón…</span></div>}
              </div>
              <div className={styles.cameraFooter}>
                <p>Apuntá la cámara al QR en la pantalla del socio.</p>
                <button type="button" className={styles.secondaryButton} onClick={stopCamera}><Keyboard size={16} aria-hidden="true" />Usar código manual</button>
              </div>
            </div>
          ) : (
            <div className={styles.methods}>
              <form onSubmit={handleValidarSubmit} className={styles.codePanel}>
                <p className={styles.methodEyebrow}>01 / INGRESO MANUAL</p>
                <h3>Ingresá el código</h3>
                <label htmlFor="codigo-cupon">Código del cupón</label>
                <div className={styles.inputWrap}>
                  <input
                    id="codigo-cupon"
                    ref={inputRef}
                    type="text"
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                    placeholder="CANJE-8F2B9M"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-describedby="codigo-help"
                    className={styles.codeInput}
                  />
                  {codigo && <button type="button" className={styles.clearButton} onClick={() => setCodigo("")} aria-label="Borrar código"><X size={18} /></button>}
                </div>
                <p id="codigo-help" className={styles.help}>Podés ingresar el código completo o solo los caracteres finales.</p>
                <button type="submit" disabled={validando || !codigo.trim()} className={styles.primaryButton}>
                  {validando ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
                  {validando ? "Validando…" : "Validar cupón"}
                </button>
              </form>
              <div className={styles.cameraPanel}>
                <p className={styles.methodEyebrow}>02 / ESCANEO</p>
                <div className={styles.cameraIcon}><Camera size={27} strokeWidth={1.6} aria-hidden="true" /></div>
                <h3>Escaneá el QR</h3>
                <p>Usá la cámara para leer el cupón desde la pantalla del socio.</p>
                <button type="button" className={styles.secondaryButton} onClick={startCamera} disabled={iniciandoCamara}>
                  {iniciandoCamara ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                  {iniciandoCamara ? "Abriendo cámara…" : "Abrir cámara"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
