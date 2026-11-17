"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Gift, Mail, MapPin, MessageCircle, Share2 } from "lucide-react";
import { RESTAURANT_INFO } from "@/data/landing-content";
import ReservationModal from "@/components/landing/ReservationModal";
import restaurantStyles from "@/components/restaurant/restaurant.module.css";
import styles from "./links.module.css";

export default function BioLinksPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "La Encontrada Wine Bistro", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // La persona puede cerrar el diálogo de compartir sin elegir destino.
    }
  }

  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.top}>
        <Link href="/" className={styles.wordmark}>La Encontrada<span>Wine Bistro · El Bolsón</span></Link>
        <button type="button" onClick={share} className={styles.share}>{copied ? <Check size={17} /> : <Share2 size={17} />}{copied ? "Copiado" : "Compartir"}</button>
      </header>

      <div className={styles.photo}>
        <Image src="/restaurant/salon.jpg" alt="Salón de La Encontrada junto al jardín" fill loading="eager" fetchPriority="high" sizes="(max-width: 640px) 100vw, 600px" />
      </div>

      <div className={styles.intro}>
        <p className={styles.eyebrow}>La Encontrada · Wine Bistro</p>
        <h1>Nos vemos en la mesa.</h1>
        <p>Cocina patagónica, vinos y encuentros en El Bolsón. Elegí cómo querés visitarnos o ponete en contacto.</p>
      </div>

      <nav aria-label="Enlaces de La Encontrada" className={styles.links}>
        <button type="button" onClick={() => setBookingOpen(true)} className={styles.primary}><CalendarDays size={20} /><span><strong>Reservar una mesa</strong><small>Consultá disponibilidad por WhatsApp</small></span><ArrowRight size={18} /></button>
        <Link href="/" className={styles.link}><ArrowUpRight size={20} /><span><strong>Conocé La Encontrada</strong><small>Cocina, lugar y horarios</small></span><ArrowRight size={18} /></Link>
        <Link href="/socio/login" className={styles.link}><Gift size={20} /><span><strong>Club de socios</strong><small>Consultá tus puntos y premios</small></span><ArrowRight size={18} /></Link>
        <a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.link}><MapPin size={20} /><span><strong>Cómo llegar</strong><small>Callejón Cerro Amigo · El Bolsón</small></span><ArrowUpRight size={18} /></a>
        <a href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className={styles.link}><MessageCircle size={20} /><span><strong>Escribinos por WhatsApp</strong><small>Consultas y carta actual</small></span><ArrowUpRight size={18} /></a>
      </nav>

      <footer className={styles.footer}>
        <div><a href={RESTAURANT_INFO.instagramUrl} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={18} /> Instagram</a><a href={`mailto:${RESTAURANT_INFO.email}`}><Mail size={18} /> Correo</a></div>
        <p>© {new Date().getFullYear()} La Encontrada Wine Bistro</p>
      </footer>
    </div>
    <div className={`${restaurantStyles.experience} ${restaurantStyles.reservation} ${restaurantStyles.reservationIvory}`}><ReservationModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} lang="es" /></div>
  </main>;
}
