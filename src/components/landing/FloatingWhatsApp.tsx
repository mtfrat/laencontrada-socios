"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { RESTAURANT_INFO } from "@/data/landing-content";

export default function FloatingWhatsApp({ lang = "es" }: { lang?: "es" | "en" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const greeting =
    lang === "es"
      ? "¡Hola La Encontrada Wine Bistro! Quisiera consultar disponibilidad y horarios."
      : "Hello La Encontrada Wine Bistro! I'd like to check availability and schedule.";

  const href = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(greeting)}`;

  return (
    <div className="fixed bottom-8 right-8 z-40 flex items-center gap-3">
      {/* Discreet Tooltip */}
      <div
        className={`hidden sm:flex items-center gap-2 bg-[#161415] border border-white/10 text-stone-300 text-xs py-2 px-4 shadow-xl transition-all duration-300 pointer-events-none font-light tracking-wide ${
          showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
        <span>
          {lang === "es" ? "Consultas & Reservas" : "Inquiries & Bookings"}
        </span>
      </div>

      {/* Floating Button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp La Encontrada Wine Bistro"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center w-12 h-12 bg-[#1a1718] hover:bg-[#4a151b] border border-white/15 text-[#f5f2eb] hover:text-white shadow-2xl transition-all duration-300 cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );
}
