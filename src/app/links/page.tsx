"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  MapPin,
  MessageCircle,
  Mail,
  Award,
  Calendar,
  Share2,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
  Check,
} from "lucide-react";
import { RESTAURANT_INFO } from "@/data/landing-content";
import ReservationModal from "@/components/landing/ReservationModal";

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

export default function BioLinksPage() {
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "La Encontrada Wine Bistro",
          text: "Alta cocina patagónica y cava seleccionada en El Bolsón. Calificación 4.9★",
          url: window.location.href,
        });
      } catch (err) {
        // Fallback
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const actionLinks = [
    {
      title: "Página Web Oficial",
      subtitle: "Historia, filosofía, cava de autor y propuesta de estación",
      href: "/",
      isInternal: true,
      icon: Globe,
      featured: true,
      bgImage: RESTAURANT_INFO.images.hero,
      badge: "Sitio Oficial",
    },
    {
      title: "Reservar una Mesa",
      subtitle: "Almuerzos (13:00 a 16:30) y Cenas (desde 20:30 hs) vía WhatsApp",
      onClick: () => setIsReserveModalOpen(true),
      icon: Calendar,
      highlight: true,
      badge: "WhatsApp",
    },
    {
      title: "Ubicación en Google Maps",
      subtitle: "Callejón Cerro Amigo, R8430 El Bolsón, Río Negro",
      href: RESTAURANT_INFO.mapsUrl,
      icon: MapPin,
      badge: "4.9 ★",
    },
    {
      title: "WhatsApp Directo",
      subtitle: "+54 9 294 430-3105 • Atención personalizada",
      href: `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
        "¡Hola La Encontrada! Quisiera comunicarme para una consulta."
      )}`,
      icon: MessageCircle,
    },
    {
      title: "Club de Socios",
      subtitle: "Programa de fidelización de comensales frecuentes",
      href: "/socio/login",
      isInternal: true,
      icon: Award,
      badge: "DNI",
    },
    {
      title: "Contacto por Correo",
      subtitle: "laencontradaresto@gmail.com",
      href: `mailto:${RESTAURANT_INFO.email}`,
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-[#111011] text-[#f5f2eb] flex flex-col items-center justify-between p-6 sm:p-10 relative overflow-hidden font-sans selection:bg-[#4a151b] selection:text-white">
      {/* Top Bar */}
      <div className="w-full max-w-md flex justify-end items-center mb-4 z-10">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-stone-400 hover:text-white transition text-[11px] font-mono tracking-widest uppercase cursor-pointer"
          title="Compartir enlace"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#c5a880]" />
              <span className="text-[#c5a880]">Enlace copiado</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center z-10 space-y-8 my-auto">
        {/* Profile Card / Header - Clean, No Glow */}
        <div className="flex flex-col items-center">
          <div className="relative mb-5">
            <div className="relative w-24 h-24 bg-[#161415] border border-white/10 p-2 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="La Encontrada Wine Bistro"
                width={80}
                height={80}
                priority
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl font-serif font-light text-[#f5f2eb] tracking-wide">
            La Encontrada
          </h1>
          <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] font-light mt-1">
            Wine Bistro • El Bolsón
          </p>

          <p className="text-stone-300 text-xs sm:text-sm mt-3 px-2 leading-relaxed font-light">
            Alta cocina patagónica y cava seleccionada en el Callejón Cerro Amigo.
          </p>

          {/* Location & Rating Badge */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={RESTAURANT_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#161415] border border-white/10 text-[#c5a880] text-xs font-mono font-light tracking-wide hover:border-white/30 transition"
            >
              <Star className="w-3.5 h-3.5 fill-[#c5a880]" />
              <span>4.9 en Google Maps</span>
            </a>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#161415] border border-white/10 text-stone-300 text-xs font-mono font-light">
              <Clock className="w-3 h-3 text-[#c5a880]" />
              <span>13:00–16:30 | 20:30–23:30</span>
            </div>
          </div>

          {/* Social Icons Row */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <a
              href={RESTAURANT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#161415] border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>

            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#161415] border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <a
              href={RESTAURANT_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#161415] border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
              aria-label="Google Maps"
            >
              <MapPin className="w-4 h-4" />
            </a>

            <a
              href={`mailto:${RESTAURANT_INFO.email}`}
              className="w-10 h-10 bg-[#161415] border border-white/10 hover:border-white text-stone-300 hover:text-white flex items-center justify-center transition"
              aria-label="Correo"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Action Link Cards - Rectangular Luxury Styling */}
        <div className="w-full space-y-3 pt-2">
          {actionLinks.map((item, index) => {
            const Icon = item.icon;

            // Featured Card: Official Website
            if (item.featured) {
              return (
                <Link
                  key={index}
                  href={item.href || "/"}
                  className="group relative block w-full overflow-hidden border border-white/15 hover:border-white transition-all duration-300 text-left p-6 shadow-xl"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.bgImage})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/70" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-white">
                        <Icon className="w-5 h-5 stroke-[1.25]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-light text-white group-hover:text-[#f5f2eb] transition">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-[#4a151b] text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-1 font-light">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            }

            // Interactive Button: Reserve Table
            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="group w-full p-5 bg-[#4a151b] hover:bg-[#5a1b23] border border-[#5a1b23] text-left transition-all duration-300 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black/30 border border-white/15 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5 stroke-[1.25]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-normal text-white">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-white/15 text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 mt-0.5 font-light">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition" />
                </button>
              );
            }

            // Standard Link
            const isExternal = !item.isInternal;
            const content = (
              <div className="group w-full p-4 bg-[#161415] hover:bg-[#1c191a] border border-white/[0.08] hover:border-white/20 text-left transition-all duration-300 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-[#111011] border border-white/10 flex items-center justify-center text-[#c5a880] group-hover:text-white transition">
                    <Icon className="w-4 h-4 stroke-[1.25]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-normal text-white group-hover:text-[#f5f2eb] transition">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-2 py-0.5 border border-white/10 text-[#c5a880]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 font-light">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                {isExternal ? (
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 transition" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition" />
                )}
              </div>
            );

            if (item.isInternal) {
              return (
                <Link key={index} href={item.href || "#"} className="block w-full">
                  {content}
                </Link>
              );
            }

            return (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                {content}
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-6 pb-2 text-center space-y-1 text-xs text-stone-500 font-mono font-light">
          <p className="text-stone-400">
            Callejón Cerro Amigo • El Bolsón, Patagonia
          </p>
          <p>© {new Date().getFullYear()} La Encontrada Wine Bistro</p>
        </div>
      </div>

      <ReservationModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        lang="es"
      />
    </main>
  );
}
