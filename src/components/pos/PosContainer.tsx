"use client";

import { useState } from "react";
import TablePointsLoader from "./TablePointsLoader";
import CanjeValidator from "./CanjeValidator";
import CierreTurnoImporter from "./CierreTurnoImporter";
import { Utensils, QrCode, FileUp } from "lucide-react";
import styles from "./PosTerminal.module.css";

export default function PosContainer({ pesosPorPunto }: { pesosPorPunto: number }) {
  const [activeTab, setActiveTab] = useState<"mesa" | "cierre" | "canje">("mesa");
  const intro = {
    mesa: {
      step: "01 / CARGA DE MESA",
      title: "Sumar puntos a una mesa",
      description: "Ingresá el ticket, la cantidad de comensales y los socios presentes. Revisá el cálculo antes de acreditar.",
    },
    cierre: {
      step: "02 / CIERRE DE TURNO",
      title: "Cierre de turno",
      description: "Importá el PDF de Maxirest y revisá cada mesa antes de acreditar puntos.",
    },
    canje: {
      step: "03 / CANJE DE PREMIOS",
      title: "Validar un premio",
      description: "Escaneá el QR o ingresá el código del cupón para confirmar la entrega al socio.",
    },
  }[activeTab];

  return (
    <div className={styles.terminal}>
      <section className={styles.intro} aria-labelledby="terminal-heading">
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}><span className={styles.liveDot} /><span className={styles.turnLabel}>TURNO ACTIVO · SALÓN BISTRÓ</span><span className={styles.separator}>/</span><span>{intro.step}</span></p>
          <h1 id="terminal-heading" className={styles.title}>{intro.title}</h1>
          <p className={styles.description}>{intro.description}</p>
        </div>
        <div className={styles.rule}>
          <span>{activeTab === "canje" ? "VALIDACIÓN EN SALÓN" : "EQUIVALENCIA ACTIVA"}</span>
          <strong>{activeTab === "canje" ? "Cupón QR" : `$${pesosPorPunto.toLocaleString("es-AR")} = 1 punto`}</strong>
        </div>
      </section>

      <div className={styles.modeNav} role="group" aria-label="Funciones de la terminal">
        <button
          type="button"
          onClick={() => setActiveTab("mesa")}
          aria-pressed={activeTab === "mesa"}
          className={`${styles.modeButton} ${activeTab === "mesa" ? styles.modeActive : ""}`}
        >
          <span className={styles.modeNumber}>01</span><Utensils size={17} aria-hidden="true" /><span>Carga de mesa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cierre")}
          aria-pressed={activeTab === "cierre"}
          className={`${styles.modeButton} ${activeTab === "cierre" ? styles.modeActive : ""}`}
        >
          <span className={styles.modeNumber}>02</span><FileUp size={17} aria-hidden="true" /><span>Cierre PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("canje")}
          aria-pressed={activeTab === "canje"}
          className={`${styles.modeButton} ${activeTab === "canje" ? styles.modeActive : ""}`}
        >
          <span className={styles.modeNumber}>03</span><QrCode size={17} aria-hidden="true" /><span>Validar cupón</span>
        </button>
      </div>

      {/* Vista Activa */}
      {activeTab === "mesa" ? (
        <TablePointsLoader pesosPorPunto={pesosPorPunto} />
      ) : activeTab === "cierre" ? (
        <CierreTurnoImporter />
      ) : (
        <CanjeValidator />
      )}
    </div>
  );
}
