"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Wine,
  Star,
  Award,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import ReservationModal from "@/components/landing/ReservationModal";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import { RESTAURANT_INFO, CONTENT, MenuItem } from "@/data/landing-content";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<
    "entradas" | "principales" | "postres"
  >("principales");

  const t = CONTENT[lang];

  const filteredMenuItems = t.cuisine.items.filter(
    (item: MenuItem) => item.category === activeMenuCategory
  );

  return (
    <div className="min-h-screen bg-[#111011] text-[#f5f2eb] flex flex-col font-sans selection:bg-[#4a151b] selection:text-white relative">
      {/* Navbar with centered brand identity */}
      <Navbar
        lang={lang}
        setLang={setLang}
        onOpenReservation={() => setIsReservationOpen(true)}
      />

      {/* 1. Full-Screen Cinematic Hero Section */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center justify-center pt-28 pb-20 px-6 sm:px-10 overflow-hidden"
      >
        {/* Full-screen high-resolution imagery */}
        <div
          className="absolute inset-0 bg-cover bg-center -z-20 scale-100 transition-transform duration-1000"
          style={{
            backgroundImage: `url(${RESTAURANT_INFO.images.hero})`,
          }}
        />

        {/* Sober neutral dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111011] via-[#111011]/70 to-[#111011]/50 -z-10" />

        {/* Content Container with Negative Space */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center z-10 space-y-8 my-auto">
          {/* Subtle Location & Rating Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono uppercase tracking-[0.25em] text-[#c5a880] font-light">
            <span>{t.hero.badge}</span>
            <span className="text-stone-600">•</span>
            <a
              href={RESTAURANT_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <Star className="w-3.5 h-3.5 fill-[#c5a880] text-[#c5a880]" />
              <span>{t.hero.ratingBadge}</span>
            </a>
          </div>

          {/* Majestic Unified Serif Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light text-[#f5f2eb] tracking-tight leading-[1.12] max-w-4xl">
            {t.hero.title}
          </h1>

          {/* Atmospheric Description */}
          <p className="text-[#d0c9c0] text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            {t.hero.subtitle}
          </p>

          {/* Clean Rectangular CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto">
            <button
              onClick={() => setIsReservationOpen(true)}
              className="w-full sm:w-auto bg-[#4a151b] hover:bg-[#5a1b23] text-[#f5f2eb] text-xs uppercase tracking-[0.22em] font-medium px-9 py-4 transition duration-300 border border-[#5a1b23] cursor-pointer"
            >
              {t.hero.ctaReserve}
            </button>

            <a
              href="#carta"
              className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white text-[#f5f2eb] text-xs uppercase tracking-[0.22em] font-light px-9 py-4 transition duration-300 text-center"
            >
              {t.hero.ctaMenu}
            </a>

            <Link
              href="/links"
              className="w-full sm:w-auto bg-transparent border border-[#c5a880]/30 hover:border-[#c5a880] text-[#c5a880] text-xs uppercase tracking-[0.2em] font-light px-6 py-4 transition duration-300 text-center"
            >
              {t.hero.ctaLinks}
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block text-stone-500 text-[11px] font-mono uppercase tracking-[0.3em]">
          <span>Desplazar</span>
        </div>
      </section>

      {/* 2. Philosophy & Mountain Terroir Section */}
      <section
        id="filosofia"
        className="py-28 lg:py-36 px-6 sm:px-10 max-w-7xl mx-auto border-t border-white/[0.06] relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          {/* Narrative Column */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-[0.3em] text-[#c5a880] font-light block">
                {t.philosophy.tag}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f5f2eb] tracking-tight leading-tight">
                {t.philosophy.title}
              </h2>
            </div>

            <div className="space-y-5 text-[#c2b9af] text-sm sm:text-base leading-relaxed font-light">
              <p>{t.philosophy.p1}</p>
              <p>{t.philosophy.p2}</p>
            </div>

            {/* Quiet Luxury Quote */}
            <blockquote className="py-4 pl-6 border-l border-[#c5a880] text-[#eae5dc] font-serif text-lg sm:text-xl font-light italic leading-relaxed">
              {t.philosophy.quote}
            </blockquote>

            {/* Architectural Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.08]">
              {t.philosophy.stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-serif font-light text-[#f5f2eb]">
                    {stat.value}
                  </div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-[#c5a880] font-light">
                    {stat.label}
                  </div>
                  <div className="text-xs text-stone-500 font-light hidden sm:block">
                    {stat.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Column: Large Format Photographic Composition */}
          <div className="lg:col-span-6 relative space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden border border-white/[0.08] shadow-2xl">
              <Image
                src={RESTAURANT_INFO.images.ambience}
                alt="Ambiente de salón y veladas en La Encontrada"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111011] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8 right-8 text-left">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                  Callejón Cerro Amigo • El Bolsón
                </span>
                <p className="font-serif text-xl font-light text-white mt-1">
                  Vistas al Cerro Piltriquitrón
                </p>
                <p className="text-xs text-stone-400 font-light mt-1 max-w-md">
                  Refugio íntimo entre la arboleda nativa andina y la música acústica en vivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Wine Cellar / La Cava Section */}
      <section
        id="cava"
        className="py-28 lg:py-36 px-6 sm:px-10 bg-[#141213] border-t border-white/[0.06] relative"
      >
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <span className="text-[11px] uppercase font-mono tracking-[0.3em] text-[#c5a880] font-light block">
              {t.cava.tag}
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f5f2eb] tracking-tight leading-tight">
              {t.cava.title}
            </h2>
            <p className="text-[#c2b9af] text-sm sm:text-base font-light leading-relaxed">
              {t.cava.subtitle}
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.cava.points.map((point, index) => (
              <div
                key={index}
                className="p-8 bg-[#181617] border border-white/[0.06] flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-8 h-8 flex items-center justify-center text-[#c5a880]">
                    <Wine className="w-5 h-5 stroke-[1.25]" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-[#f5f2eb]">
                    {point.title}
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed">
                    {point.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] text-[10px] uppercase font-mono tracking-widest text-[#c5a880]">
                  Curaduría Bistró
                </div>
              </div>
            ))}
          </div>

          {/* Sommelier Banner */}
          <div className="p-8 sm:p-10 bg-[#181617] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                Servicio de Sommelier
              </span>
              <h4 className="font-serif text-2xl font-light text-[#f5f2eb]">
                {lang === "es"
                  ? "Asesoramiento de maridaje paso a paso en mesa"
                  : "Tailored sommelier pairing at your table"}
              </h4>
              <p className="text-stone-400 text-xs sm:text-sm font-light">
                {lang === "es"
                  ? "Vinos por copa y botellas seleccionadas para cada momento de tu velada."
                  : "Wine by the glass and bottles curated for every moment of your dinner."}
              </p>
            </div>

            <button
              onClick={() => setIsReservationOpen(true)}
              className="bg-[#4a151b] hover:bg-[#5a1b23] text-[#f5f2eb] text-xs uppercase tracking-[0.2em] font-medium px-8 py-3.5 transition duration-300 border border-[#5a1b23] shrink-0"
            >
              {lang === "es" ? "Reservar con maridaje" : "Book table with pairing"}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Culinary Proposal / Carta de Autor */}
      <section
        id="carta"
        className="py-28 lg:py-36 px-6 sm:px-10 max-w-7xl mx-auto border-t border-white/[0.06] relative"
      >
        <div className="space-y-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <span className="text-[11px] uppercase font-mono tracking-[0.3em] text-[#c5a880] font-light block">
                {t.cuisine.tag}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f5f2eb] tracking-tight leading-tight">
                {t.cuisine.title}
              </h2>
              <p className="text-[#c2b9af] text-sm sm:text-base font-light leading-relaxed">
                {t.cuisine.subtitle}
              </p>
            </div>

            {/* Sober Rectangular Tabs */}
            <div className="flex border border-white/10 p-1 bg-[#161415] shrink-0">
              {(
                [
                  { id: "entradas", label: t.cuisine.tabs.entradas },
                  { id: "principales", label: t.cuisine.tabs.principales },
                  { id: "postres", label: t.cuisine.tabs.postres },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMenuCategory(tab.id)}
                  className={`px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition duration-200 cursor-pointer ${
                    activeMenuCategory === tab.id
                      ? "bg-[#4a151b] text-white font-medium"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Showcase with Real Gastronomy Photography */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMenuItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#181617] border border-white/[0.06] flex flex-col justify-between overflow-hidden group"
              >
                {/* Dish Photo */}
                {item.image && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181617] via-transparent to-transparent opacity-60" />
                    {item.tag && (
                      <span className="absolute top-4 left-4 text-[9px] uppercase font-mono tracking-[0.2em] px-2.5 py-1 bg-[#111011]/85 backdrop-blur-sm text-[#c5a880] border border-white/10">
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#f5f2eb]">
                      {item.title}
                    </h3>
                    <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.pairing && (
                    <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#c5a880] flex items-center gap-2">
                      <Wine className="w-3.5 h-3.5 shrink-0 stroke-[1.25]" />
                      <span className="italic font-light">{item.pairing}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div className="text-center text-xs text-stone-500 font-mono tracking-wider">
            {lang === "es"
              ? "✦ Carta de autor sujeta a recolección fresca y disponibilidad de productores de la Comarca Andina."
              : "✦ Seasonal kitchen proposal subject to fresh harvests from local Andean growers."}
          </div>
        </div>
      </section>

      {/* 5. Guest Reviews & 4.9 Score */}
      <section className="py-24 px-6 sm:px-10 bg-[#141213] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#c5a880] tracking-widest uppercase">
              <Star className="w-3.5 h-3.5 fill-[#c5a880]" />
              <span>4.9 / 5.0 • Google Maps</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#f5f2eb]">
              {t.reviews.title}
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm font-light">
              {t.reviews.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.reviews.items.map((review, i) => (
              <div
                key={i}
                className="p-8 bg-[#181617] border border-white/[0.06] flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-[#c5a880] text-[#c5a880]" />
                    ))}
                  </div>
                  <p className="text-[#ded9d2] text-sm font-serif italic font-light leading-relaxed">
                    «{review.comment}»
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#f5f2eb] font-medium">{review.author}</span>
                  <span className="text-stone-500">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Hours, Location & Direct Contact */}
      <section
        id="ubicacion"
        className="py-28 lg:py-36 px-6 sm:px-10 max-w-7xl mx-auto border-t border-white/[0.06]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          {/* Details */}
          <div className="lg:col-span-6 space-y-10">
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-[0.3em] text-[#c5a880] font-light block">
                {t.location.tag}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f5f2eb] tracking-tight leading-tight">
                {t.location.title}
              </h2>
              <p className="text-[#c2b9af] text-sm font-light leading-relaxed">
                {t.location.mapHint}
              </p>
            </div>

            {/* Address */}
            <div className="p-8 bg-[#181617] border border-white/[0.06] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                {t.location.addressLabel}
              </span>
              <p className="text-lg font-serif font-normal text-white">
                {t.location.addressValue}
              </p>
              <p className="text-xs text-stone-500 font-mono">
                El Bolsón, Río Negro • A 8 cuadras de Plaza Pagano
              </p>
            </div>

            {/* Schedule */}
            <div className="p-8 bg-[#181617] border border-white/[0.06] space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                {t.location.hoursLabel}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#111011] border border-white/[0.06] space-y-1">
                  <span className="text-xs uppercase tracking-wider text-white font-medium block">
                    {t.location.lunchTitle}
                  </span>
                  <span className="text-xs font-mono text-[#c5a880]">
                    {t.location.lunchHours}
                  </span>
                </div>

                <div className="p-4 bg-[#111011] border border-white/[0.06] space-y-1">
                  <span className="text-xs uppercase tracking-wider text-white font-medium block">
                    {t.location.dinnerTitle}
                  </span>
                  <span className="text-xs font-mono text-stone-300 block">
                    {t.location.dinnerWeekdays}
                  </span>
                  <span className="text-xs font-mono text-stone-400 block">
                    {t.location.dinnerWeekends}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => setIsReservationOpen(true)}
                className="flex-1 bg-[#4a151b] hover:bg-[#5a1b23] text-[#f5f2eb] py-4 text-xs uppercase tracking-[0.2em] font-medium transition duration-300 border border-[#5a1b23] cursor-pointer text-center"
              >
                {t.location.btnReserve}
              </button>

              <a
                href={RESTAURANT_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-transparent border border-white/20 hover:border-white text-[#f5f2eb] py-4 text-xs uppercase tracking-[0.2em] font-light transition duration-300 text-center"
              >
                {t.location.btnMaps}
              </a>
            </div>
          </div>

          {/* Map Preview & Bio Links Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative border border-white/[0.08] bg-[#181617] shadow-2xl aspect-[16/11] overflow-hidden">
              <iframe
                title="Mapa de La Encontrada Wine Bistro"
                src="https://maps.google.com/maps?q=-41.9688864,-71.5215975&z=16&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(1.15)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
              <div className="absolute top-4 left-4 p-4 bg-[#111011]/90 backdrop-blur-md border border-white/10 text-xs">
                <span className="font-serif text-white font-medium block">
                  La Encontrada Wine Bistro
                </span>
                <span className="text-stone-400 text-[11px] font-mono">
                  Callejón Cerro Amigo, El Bolsón
                </span>
              </div>
            </div>

            {/* Discreet Linktree callout */}
            <div className="p-8 bg-[#181617] border border-white/[0.06] flex items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                  Bio-Links Móvil
                </span>
                <h4 className="font-serif text-lg font-light text-white">
                  Canales directos para redes sociales
                </h4>
                <p className="text-xs text-stone-400 font-light">
                  WhatsApp, Google Maps, reservas y sitio web en formato para bio de Instagram.
                </p>
              </div>

              <Link
                href="/links"
                className="px-6 py-3 border border-white/20 hover:border-white text-white text-xs uppercase tracking-[0.2em] font-light transition shrink-0"
              >
                Ver /links
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Members Club Callout */}
      <section className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="p-10 sm:p-14 bg-[#181617] border border-[#c5a880]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
              {t.club.tag}
            </span>
            <h3 className="text-2xl sm:text-4xl font-serif font-light text-white tracking-tight">
              {t.club.title}
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed">
              {t.club.desc}
            </p>
          </div>

          <Link
            href="/socio/login"
            className="bg-[#c5a880] hover:bg-[#d8c09d] text-[#111011] text-xs uppercase tracking-[0.2em] font-medium px-8 py-4 transition duration-300 shrink-0"
          >
            {t.club.btn}
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-white/[0.06] bg-[#0d0c0d] text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Col 1: Identity */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="La Encontrada"
                  width={34}
                  height={34}
                  className="object-contain"
                />
                <div>
                  <span className="font-serif text-xl font-normal text-white block">
                    La Encontrada
                  </span>
                  <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                    Wine Bistro • El Bolsón
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-400 max-w-md font-light leading-relaxed">
                {t.footer.about}
              </p>
              <div className="pt-2 flex items-center space-x-4">
                <a
                  href={RESTAURANT_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={RESTAURANT_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
                  aria-label="Google Maps"
                >
                  <MapPin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                {t.footer.links}
              </span>
              <ul className="space-y-2.5 font-light text-stone-300">
                <li>
                  <a href="#filosofia" className="hover:text-white transition">
                    {t.nav.philosophy}
                  </a>
                </li>
                <li>
                  <a href="#cava" className="hover:text-white transition">
                    {t.nav.cava}
                  </a>
                </li>
                <li>
                  <a href="#carta" className="hover:text-white transition">
                    {t.nav.cuisine}
                  </a>
                </li>
                <li>
                  <a href="#ubicacion" className="hover:text-white transition">
                    {t.nav.hours}
                  </a>
                </li>
                <li>
                  <Link href="/links" className="text-[#c5a880] hover:text-white transition">
                    Bio-Links (/links)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Systems */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block font-light">
                Sistemas
              </span>
              <ul className="space-y-2.5 font-light text-stone-300">
                <li>
                  <Link href="/socio/login" className="hover:text-white transition">
                    Portal de Socios (DNI)
                  </Link>
                </li>
                <li>
                  <Link href="/pos" className="hover:text-white transition">
                    Terminal de Mozos
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-white transition">
                    Administración
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-stone-500 font-light">
            <p>
              © {new Date().getFullYear()} {RESTAURANT_INFO.name}. {t.footer.rights}
            </p>
            <p>Callejón Cerro Amigo, El Bolsón • Patagonia Argentina</p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <FloatingWhatsApp lang={lang} />
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        lang={lang}
      />
    </div>
  );
}
