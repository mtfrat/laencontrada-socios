"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CONTENT } from "@/data/landing-content";

interface NavbarProps {
  lang: "es" | "en";
  setLang: (lang: "es" | "en") => void;
  onOpenReservation: () => void;
}

export default function Navbar({ lang, setLang, onOpenReservation }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = CONTENT[lang].nav;
  const links = [
    { href: "#filosofia", label: t.philosophy },
    { href: "#cava", label: t.cava },
    { href: "#carta", label: t.cuisine },
    { href: "#ubicacion", label: t.hours },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    const wide = window.matchMedia("(min-width: 1280px)");
    const closeOnWide = () => { if (wide.matches) setMobileMenuOpen(false); };
    wide.addEventListener("change", closeOnWide);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      wide.removeEventListener("change", closeOnWide);
    };
  }, []);

  const reserve = () => {
    if (mobileMenuOpen) menuButton.current?.focus();
    setMobileMenuOpen(false);
    onOpenReservation();
  };
  const languageSwitch = (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
      className="min-h-11 min-w-11 px-3 text-xs text-champagne-warm border border-white/20 hover:border-gold-points transition"
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-200 motion-reduce:transition-none ${scrolled || mobileMenuOpen ? "bg-bistro-card border-white/10" : "bg-bistro-canvas/90 border-transparent"}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobileMenuOpen) {
          setMobileMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="La Encontrada — inicio">
          <Image src="/logo.png" alt="" width={40} height={40} priority className="object-contain" />
          <span>
            <span className="block font-serif text-2xl text-champagne-warm leading-none">La Encontrada</span>
            <span className="block mt-2 text-[10px] tracking-[0.14em] uppercase text-gold-points">Wine Bistro · El Bolsón</span>
          </span>
        </Link>
        <nav aria-label={lang === "es" ? "Navegación principal" : "Main navigation"} className="hidden xl:flex items-center gap-5">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="py-3 text-xs text-champagne-warm hover:text-gold-points transition whitespace-nowrap">{link.label}</a>
          ))}
          <Link href="/socio/login" className="py-3 text-xs text-gold-points whitespace-nowrap">{t.club}</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">{languageSwitch}</div>
          <button onClick={reserve} className="hidden sm:block min-h-11 px-5 bg-wine-800 hover:bg-wine-700 text-white text-sm transition whitespace-nowrap">{t.reserve}</button>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? (lang === "es" ? "Cerrar menú" : "Close menu") : (lang === "es" ? "Abrir menú" : "Open menu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="xl:hidden min-w-11 min-h-11 flex items-center justify-center text-champagne-warm border border-white/20"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" hidden={!mobileMenuOpen} aria-label={lang === "es" ? "Navegación móvil" : "Mobile navigation"} className="xl:hidden border-t border-white/10 max-h-[calc(100dvh-6rem)] overflow-y-auto px-5 py-5 bg-bistro-card">
        <div className="max-w-xl mx-auto flex flex-col">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg text-champagne-warm hover:text-gold-points">{link.label}</a>
          ))}
          <Link href="/socio/login" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg text-gold-points">{t.club}</Link>
          <Link href="/links" onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm text-champagne-muted">{lang === "es" ? "Contacto y redes" : "Contact & social"}</Link>
          <div className="flex items-center gap-3 mt-4 pt-5 border-t border-white/10">
            <button onClick={reserve} className="min-h-12 flex-1 bg-wine-800 hover:bg-wine-700 px-4 text-white text-sm">{t.reserve}</button>
            <div className="sm:hidden">{languageSwitch}</div>
          </div>
        </div>
      </nav>
    </header>
  );
}
