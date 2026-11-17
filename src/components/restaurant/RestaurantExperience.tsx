"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Menu, Plus, Star, X } from "lucide-react";
import ReservationModal from "@/components/landing/ReservationModal";
import Dialog from "@/components/ui/Dialog";
import { RESTAURANT_INFO } from "@/data/landing-content";
import { experienceCopy, guestReviews, restaurantPhotos } from "./restaurant-copy";
import NightStory from "./NightStory";
import styles from "./restaurant.module.css";

export default function RestaurantExperience({ variant, preview = true }: { variant: "marfil" | "noche"; preview?: boolean }) {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = experienceCopy[lang];
  const night = variant === "noche";
  const whatsapp = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(lang === "es" ? "¡Hola La Encontrada! ¿Me comparten la carta y los vinos disponibles?" : "Hello La Encontrada! Could you share your current food and wine menu?")}`;
  const reserve = () => {
    if (menuOpen) menuButton.current?.focus();
    setMenuOpen(false);
    setBookingOpen(true);
  };
  const movePhoto = (direction: number) => setPhoto((current) => current === null ? null : (current + direction + restaurantPhotos.length) % restaurantPhotos.length);
  const navLinks = ["#cocina", "#lugar", "#visita"];

  return (
    <div className={`${styles.experience} ${night ? styles.night : styles.ivory} ${preview ? "" : styles.live}`} lang={lang}>
      <a href="#contenido" className={styles.skip}>{t.skip}</a>
      {preview && <nav aria-label={t.compare} className={styles.previewBar}>
        <Link href="/propuestas" className={styles.compareLink}><ArrowLeft size={14} /><span>{t.compare}</span></Link>
        <div>
          <Link href="/propuestas/marfil" aria-current={!night ? "page" : undefined}>Marfil</Link>
          <Link href="/propuestas/noche" aria-current={night ? "page" : undefined}>Noche</Link>
        </div>
      </nav>}

      <header className={styles.header} onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
      }}>
        <div className={styles.headerInner}>
          <a href="#inicio" className={styles.brand} aria-label="La Encontrada Wine Bistro — inicio">
            <Image src="/logo.png" alt="" width={46} height={46} className={styles.logo} />
            <span><span className={styles.brandName}>La Encontrada</span><span className={styles.brandDetail}>Wine Bistro · El Bolsón</span></span>
          </a>
          <nav aria-label={lang === "es" ? "Navegación principal" : "Main navigation"} className={styles.desktopNav}>
            {navLinks.map((href, i) => <a key={href} href={href}>{t.nav[i]}</a>)}
            {night ? <Link href="/socio/login">{t.club}</Link> : <a href="#club">{t.club}</a>}
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.language} onClick={() => setLang(lang === "es" ? "en" : "es")} aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}>{lang === "es" ? "EN" : "ES"}</button>
            <button className={`${styles.button} ${styles.headerReserve}`} onClick={reserve}>{t.reserve}</button>
            <button ref={menuButton} className={styles.menuButton} aria-label={menuOpen ? t.closeMenu : t.openMenu} aria-expanded={menuOpen} aria-controls="restaurant-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        <nav id="restaurant-menu" hidden={!menuOpen} className={styles.mobileNav} aria-label={lang === "es" ? "Navegación móvil" : "Mobile navigation"}>
          {navLinks.map((href, i) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{t.nav[i]}</a>)}
          {night ? <Link href="/socio/login" onClick={() => setMenuOpen(false)}>{t.club}</Link> : <a href="#club" onClick={() => setMenuOpen(false)}>{t.club}</a>}
          <button className={styles.button} onClick={reserve}>{t.reserve}<ArrowUpRight size={17} /></button>
        </nav>
      </header>

      <main id="contenido">
        <section id="inicio" className={styles.hero}>
          <div className={styles.heroPhoto}>
            <Image src={restaurantPhotos[0].src} alt={restaurantPhotos[0][lang]} fill loading="eager" fetchPriority="high" sizes={night ? "100vw" : "(max-width: 760px) 100vw, 54vw"} />
          </div>
          <div className={styles.heroContent}>
            <h1>{night ? t.nightTitle : t.title}</h1>
            <p>{t.intro}</p>
            <div className={styles.heroActions}>
              <button onClick={reserve} className={styles.button}>{t.reserve}<ArrowUpRight size={18} /></button>
              <a href="#cocina" className={styles.textLink}>{t.explore}<ArrowDown size={16} /></a>
            </div>
          </div>
          <div className={styles.heroFoot}><span>{t.location}</span><a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer"><Star size={14} fill="currentColor" /> {t.rating}<ArrowUpRight size={14} /></a></div>
        </section>

        {night ? <NightStory lang={lang} onPhoto={setPhoto} onReserve={reserve} menuUrl={whatsapp} /> : <><section id="cocina" className={`${styles.section} ${styles.kitchen}`}>
          <div className={styles.sectionIntro}>
            <h2>{t.kitchenTitle}</h2>
            <div><p>{t.kitchen}</p><a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t.menu}<ArrowUpRight size={17} /></a></div>
          </div>
          <div className={styles.foodGrid}>
            {[1, 2].map((index, i) => <figure key={index}>
              <button className={styles.photoButton} onClick={() => setPhoto(index)} aria-label={`${t.gallery}: ${restaurantPhotos[index][lang]}`}>
                <Image src={restaurantPhotos[index].src} alt={restaurantPhotos[index][lang]} fill sizes="(max-width: 640px) 100vw, 55vw" />
                <span className={styles.expandIcon} aria-hidden="true"><Plus size={20} /></span>
              </button>
              <figcaption>{t.foodCaptions[i]}</figcaption>
            </figure>)}
          </div>
          <p className={styles.menuNote}>{t.menuNote}</p>
        </section>

        <section id="lugar" className={styles.place}>
          <button className={`${styles.photoButton} ${styles.placePhoto}`} onClick={() => setPhoto(6)} aria-label={`${t.gallery}: ${restaurantPhotos[6][lang]}`}>
            <Image src={restaurantPhotos[6].src} alt={restaurantPhotos[6][lang]} fill sizes="(max-width: 760px) 100vw, 52vw" />
            <span className={styles.expandIcon} aria-hidden="true"><Plus size={20} /></span>
          </button>
          <div className={styles.placeText}><h2>{t.welcomeTitle}</h2><p>{t.welcome}</p><div className={styles.wine}><h3>{t.wineTitle}</h3><p>{t.wine}</p><a href={RESTAURANT_INFO.instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t.instagram}<ArrowUpRight size={17} /></a></div></div>
        </section>

        <section className={`${styles.section} ${styles.reviews}`} aria-labelledby="reviews-title">
          <div className={styles.reviewsHeading}><h2 id="reviews-title">{t.reviewsTitle}</h2><div><p className={styles.rating}><Star size={17} fill="currentColor" />{t.rating}</p><span className={styles.checked}>{t.checked}</span></div></div>
          <div className={styles.reviewGrid}>{guestReviews.map((review) => <figure key={review.author}><blockquote lang="es">“{review.quote}”</blockquote><figcaption>{review.author}<span>Google Maps</span></figcaption></figure>)}</div>
          <a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t.reviewsLink}<ArrowUpRight size={17} /></a>
        </section>

        <section id="club" className={`${styles.section} ${styles.club}`} aria-labelledby="club-title">
          <div><span className={styles.clubEyebrow}>{t.clubEyebrow}</span><h2 id="club-title">{t.clubTitle}</h2></div>
          <div className={styles.clubDetails}><p>{t.clubBody}</p><p>{t.clubNote}</p><Link href="/socio/login" className={styles.button}>{t.clubAction}<ArrowUpRight size={18} /></Link></div>
        </section></>}

        <section id="visita" className={styles.visit}>
          <div className={styles.visitMain}><h2>{t.visitTitle}</h2><address>{t.address}<span>{t.region}</span></address><a className={styles.textLink} href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer">{t.directions}<ArrowUpRight size={17} /></a><p className={styles.accessibilityNote}>{t.accessibility}</p></div>
          <div className={styles.visitDetails}>
            <dl className={styles.hours}>
              <div><dt>{t.lunch}</dt><dd><span>{t.daily}</span><strong>13:00 — 16:30</strong></dd></div>
              <div><dt>{t.dinner}</dt><dd><span>{t.weekdays}</span><strong>20:30 — 23:00</strong></dd><dd><span>{t.weekends}</span><strong>20:30 — 23:30</strong></dd></div>
            </dl>
            <button onClick={reserve} className={styles.button}>{t.reserve}<ArrowUpRight size={18} /></button><p className={styles.visitNote}>{t.visitNote}</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}><a href="#inicio" className={styles.footerBrand}>La Encontrada<span>Wine Bistro</span></a><p>{t.footerLine}</p><div><a href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`} target="_blank" rel="noopener noreferrer">{t.contact}<ArrowUpRight size={15} /></a><a href={RESTAURANT_INFO.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram<ArrowUpRight size={15} /></a><Link href="/socio/login">{t.club}<ArrowUpRight size={15} /></Link></div></div>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} La Encontrada Wine Bistro</span><a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer">{night ? (lang === "es" ? "Fotografías de La Encontrada y visitantes, publicadas en Google Maps." : "Photographs by La Encontrada and guests, published on Google Maps.") : t.photoCredit}</a></div>
      </footer>

      <div className={`${styles.reservation} ${night ? styles.reservationNight : styles.reservationIvory}`}><ReservationModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} lang={lang} /></div>
      <Dialog open={photo !== null} onClose={() => setPhoto(null)} labelledBy="gallery-caption" className={styles.galleryDialog}>
        {photo !== null && <div className={styles.gallery} onKeyDown={(event) => { if (event.key === "ArrowRight") movePhoto(1); if (event.key === "ArrowLeft") movePhoto(-1); }}>
          <button className={styles.galleryClose} onClick={() => setPhoto(null)} aria-label={t.close}><X size={24} /></button>
          <div className={styles.galleryImage}><Image src={restaurantPhotos[photo].src} alt={restaurantPhotos[photo][lang]} fill sizes="90vw" /></div>
          <div className={styles.galleryControls}><button onClick={() => movePhoto(-1)} aria-label={t.previous}><ArrowLeft /></button><p id="gallery-caption" aria-live="polite">{restaurantPhotos[photo][lang]}<span>{lang === "es" ? "Foto" : "Photo"}: {restaurantPhotos[photo].author} · Google Maps · {photo + 1} / {restaurantPhotos.length}</span></p><button onClick={() => movePhoto(1)} aria-label={t.next}><ArrowRight /></button></div>
        </div>}
      </Dialog>
    </div>
  );
}
