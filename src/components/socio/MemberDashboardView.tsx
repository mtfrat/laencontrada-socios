import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Gift, MapPin, Star, Trophy } from "lucide-react";
import SocioLogoutButton from "./LogoutButton";
import MemberNavigation from "./MemberNavigation";
import styles from "./member.module.css";

export interface MemberDashboardData {
  nombre: string;
  apellido: string | null;
  numeroSocio: string;
  puntosActuales: number;
  puntosHistoricos: number;
  transacciones: { id: string; motivo: string; puntos: number; createdAt: Date }[];
  encuestaPendienteId?: string;
}

export default function MemberDashboardView({ socio, preview = false }: { socio: MemberDashboardData; preview?: boolean }) {
  const nombre = socio.nombre.trim().split(/\s+/)[0];
  return <div className={styles.memberPage}>
    <header className={styles.memberHeader}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="La Encontrada, ir al inicio">
          <Image src="/logo.png" alt="" width={46} height={46} />
          <span><strong>La Encontrada</strong><small>Club de socios · Wine Bistro</small></span>
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.memberNumber}>Socio {socio.numeroSocio}</span>
          {preview ? <Link href="/socio/login" className={styles.headerExit}>Ingresar al club <ArrowRight size={16} /></Link> : <SocioLogoutButton />}
        </div>
      </div>
    </header>

    <main className={styles.dashboardMain}>
      {preview && <div className={styles.previewNote}>Vista previa · Los datos de esta pantalla son ilustrativos.</div>}
      <div className={styles.welcome}>
        <div><h1>Hola, {nombre}.</h1><p>Esta es tu mesa en el Club de La Encontrada.</p></div>
        <span className={styles.welcomePlace}><MapPin size={15} /> El Bolsón, Patagonia</span>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.primaryColumn}>
          <section className={styles.balanceCard} aria-labelledby="balance-title">
            <div className={styles.balanceTop}><h2 id="balance-title">Tus puntos disponibles</h2><Image src="/logo.png" alt="" width={38} height={38} /></div>
            <p className={styles.balanceValue}>{socio.puntosActuales.toLocaleString("es-AR")}<span> puntos</span></p>
            <div className={styles.balanceBottom}><span>{socio.nombre} {socio.apellido ?? ""}</span><span>{socio.puntosHistoricos.toLocaleString("es-AR")} acumulados en total</span></div>
          </section>

          <div className={styles.actionPair}>
            <Link href="/socio/premios" className={styles.mainAction}><span><Gift size={23} /> Canjeá puntos</span><small>Explorá los premios para tu próxima visita.</small><ArrowRight className={styles.actionArrow} size={22} /></Link>
            <Link href="/socio/historial" className={styles.secondaryAction}><span><Clock3 size={22} /> Tus visitas</span><small>Revisá mesas, platos y movimientos.</small><ArrowRight className={styles.actionArrow} size={22} /></Link>
          </div>

          <section className={styles.activity} aria-labelledby="activity-title">
            <div className={styles.sectionHeading}><h2 id="activity-title">Movimientos recientes</h2><Link href="/socio/historial">Ver historial <ArrowRight size={16} /></Link></div>
            {socio.transacciones.length === 0 ? <p className={styles.emptyActivity}>Tus movimientos van a aparecer acá después de tu primera visita.</p> : <ul>{socio.transacciones.map((item) => <li key={item.id}><div><strong>{item.motivo}</strong><time dateTime={item.createdAt.toISOString()}>{item.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</time></div><span className={item.puntos >= 0 ? styles.positive : styles.negative}>{item.puntos > 0 ? "+" : ""}{item.puntos.toLocaleString("es-AR")} pts</span></li>)}</ul>}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.tablePhoto}><Image src="/restaurant/salon.jpg" alt="Salón de La Encontrada con mesas junto a los ventanales" fill sizes="(max-width: 760px) 100vw, 390px" /></div>
          <div className={styles.tableText}><h2>Nos vemos en la mesa.</h2><p>Buena cocina, una copa de vino y tiempo para compartir.</p><Link href="/">Conocé el restaurante <ArrowRight size={17} /></Link></div>
          {socio.encuestaPendienteId ? <Link href={`/socio/encuesta/${socio.encuestaPendienteId}`} className={styles.feedbackAction}><Star size={21} /><span><strong>¿Cómo estuvo tu última visita?</strong><small>Contanos y sumá los puntos de la encuesta.</small></span><ArrowRight size={19} /></Link> : <Link href="/socio/ranking" className={styles.feedbackAction}><Trophy size={21} /><span><strong>Tu lugar en el club</strong><small>Mirá el ranking de socios.</small></span><ArrowRight size={19} /></Link>}
        </aside>
      </div>
    </main>
    {preview && <MemberNavigation preview />}
  </div>;
}
