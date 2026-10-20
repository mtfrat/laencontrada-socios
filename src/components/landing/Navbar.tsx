"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Award, Calendar } from "lucide-react";
import { CONTENT } from "@/data/landing-content";

interface NavbarProps {
  lang: "es" | "en";
  setLang: (lang: "es" | "en") => void;
  onOpenReservation: () => void;
}

export default function Navbar({ lang, setLang, onOpenReservation }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = CONTENT[lang].nav;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-[#111011]/95 backdrop-blur-md py-4 border-b border-white/[0.06] shadow-xl"
            : "bg-gradient-to-b from-[#111011]/90 via-[#111011]/40 to-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Left Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-10">
            <a
              href="#filosofia"
              className="text-xs uppercase tracking-[0.2em] text-[#d5cfc7] hover:text-white transition duration-300 font-light"
            >
              {t.philosophy}
            </a>
            <a
              href="#cava"
              className="text-xs uppercase tracking-[0.2em] text-[#d5cfc7] hover:text-white transition duration-300 font-light"
            >
              {t.cava}
            </a>
            <a
              href="#carta"
              className="text-xs uppercase tracking-[0.2em] text-[#d5cfc7] hover:text-white transition duration-300 font-light"
            >
              {t.cuisine}
            </a>
          </nav>

          {/* Center Brand Identity (Single clean logo & typography) */}
          <Link
            href="/"
            className="flex flex-col items-center text-center group cursor-pointer transition-transform duration-300"
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="La Encontrada Wine Bistro"
                width={36}
                height={36}
                priority
                className="object-contain transition-opacity duration-300 group-hover:opacity-90"
              />
              <div className="text-left">
                <span className="font-serif text-xl sm:text-2xl tracking-[0.08em] text-[#f5f2eb] font-normal block leading-tight">
                  La Encontrada
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-[#c5a880] block font-light">
                  Wine Bistro • El Bolsón
                </span>
              </div>
            </div>
          </Link>

          {/* Right Navigation & CTAs (Desktop) */}
          <div className="hidden lg:flex items-center space-x-8">
            <a
              href="#ubicacion"
              className="text-xs uppercase tracking-[0.2em] text-[#d5cfc7] hover:text-white transition duration-300 font-light"
            >
              {t.hours}
            </a>

            {/* Club de Socios minimal link */}
            <Link
              href="/socio/login"
              className="text-xs uppercase tracking-[0.2em] text-[#c5a880] hover:text-[#e4cfb5] transition duration-300 font-light"
              title="Portal de Socios"
            >
              {t.club}
            </Link>

            {/* Language Selector */}
            <div className="flex items-center border border-white/10 px-2 py-1 text-[11px] font-mono tracking-wider">
              <button
                onClick={() => setLang("es")}
                className={`px-1.5 transition ${
                  lang === "es" ? "text-white font-medium" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                ES
              </button>
              <span className="text-stone-600">/</span>
              <button
                onClick={() => setLang("en")}
                className={`px-1.5 transition ${
                  lang === "en" ? "text-white font-medium" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                EN
              </button>
            </div>

            {/* Rectangular Luxury CTA Button */}
            <button
              onClick={onOpenReservation}
              className="bg-[#4a151b] hover:bg-[#5a1b23] text-[#f5f2eb] text-xs uppercase tracking-[0.2em] font-medium px-6 py-3 transition duration-300 cursor-pointer border border-[#5a1b23]/50"
            >
              {t.reserve}
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center space-x-3 lg:hidden">
            <button
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className="px-2 py-1 text-[11px] font-mono border border-white/10 text-stone-300 uppercase tracking-widest"
            >
              {lang}
            </button>

            <button
              onClick={onOpenReservation}
              className="bg-[#4a151b] text-[#f5f2eb] text-[11px] uppercase tracking-[0.15em] px-3.5 py-2 font-medium"
            >
              {t.reserve}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#111011]/98 backdrop-blur-xl pt-28 px-8 flex flex-col justify-between pb-10 lg:hidden animate-in fade-in duration-300">
          <div className="space-y-6">
            <nav className="flex flex-col space-y-5 border-t border-white/10 pt-6">
              <a
                href="#filosofia"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#f5f2eb] font-light tracking-wide"
              >
                {t.philosophy}
              </a>
              <a
                href="#cava"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#f5f2eb] font-light tracking-wide"
              >
                {t.cava}
              </a>
              <a
                href="#carta"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#f5f2eb] font-light tracking-wide"
              >
                {t.cuisine}
              </a>
              <a
                href="#ubicacion"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#f5f2eb] font-light tracking-wide"
              >
                {t.hours}
              </a>
              <Link
                href="/links"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#c5a880] font-light tracking-wide"
              >
                Bio-Links & Redes
              </Link>
              <Link
                href="/socio/login"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#c5a880] font-light tracking-wide"
              >
                {t.club}
              </Link>
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReservation();
              }}
              className="w-full bg-[#4a151b] text-[#f5f2eb] py-4 uppercase tracking-[0.2em] text-xs font-medium"
            >
              {t.reserve}
            </button>
            <p className="text-stone-500 text-xs font-mono tracking-wider">
              Callejón Cerro Amigo • El Bolsón, Patagonia
            </p>
          </div>
        </div>
      )}
    </>
  );
}
