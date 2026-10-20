"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, User, MessageSquare, Phone, ArrowRight } from "lucide-react";
import { RESTAURANT_INFO, CONTENT } from "@/data/landing-content";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "es" | "en";
}

export default function ReservationModal({
  isOpen,
  onClose,
  lang = "es",
}: ReservationModalProps) {
  const t = CONTENT[lang].modal;

  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [shift, setShift] = useState<"lunch" | "dinner">("dinner");
  const [time, setTime] = useState("21:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const lunchTimes = ["13:00", "13:30", "14:00", "14:30", "15:00"];
  const dinnerTimes = ["20:30", "21:00", "21:30", "22:00", "22:30"];

  useEffect(() => {
    if (shift === "lunch" && !lunchTimes.includes(time)) {
      setTime("13:30");
    } else if (shift === "dinner" && !dinnerTimes.includes(time)) {
      setTime("21:00");
    }
  }, [shift]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleWhatsAppBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const shiftText =
      shift === "lunch"
        ? lang === "es"
          ? "Almuerzo (Mediodía)"
          : "Lunch"
        : lang === "es"
        ? "Cena (Noche)"
        : "Dinner";

    const message =
      lang === "es"
        ? `¡Hola La Encontrada Wine Bistro! 🍷\nQuisiera solicitar una reserva de mesa:\n\n• Fecha: ${date}\n• Turno: ${shiftText}\n• Horario estimado: ${time} hs\n• Comensales: ${guests} personas\n• A nombre de: ${name || "Cliente"}\n${phone ? `• Teléfono: ${phone}\n` : ""}${notes ? `• Notas especiales: ${notes}\n` : ""}\n¿Tienen disponibilidad? ¡Muchas gracias!`
        : `Hello La Encontrada Wine Bistro! 🍷\nI would like to request a table reservation:\n\n• Date: ${date}\n• Service: ${shiftText}\n• Time: ${time}\n• Guests: ${guests} people\n• Name: ${name || "Guest"}\n${phone ? `• Phone: ${phone}\n` : ""}${notes ? `• Special Notes: ${notes}\n` : ""}\nCould you please check availability? Thank you!`;

    const waUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm transition-opacity"
    >
      <div
        className="relative w-full max-w-xl bg-[#161415] border border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/[0.08] bg-[#1a1718]">
          <button
            onClick={onClose}
            aria-label={t.cancel}
            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c5a880] block mb-2 font-light">
            La Encontrada Wine Bistro
          </span>
          <h2 id="reservation-title" className="text-2xl sm:text-3xl font-serif text-[#f5f2eb] font-normal tracking-wide">
            {t.title}
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm mt-1.5 font-light leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleWhatsAppBooking} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Step 1: Date and Shift */}
          <div className="space-y-4">
            <label className="text-[11px] uppercase tracking-[0.2em] text-[#c5a880] flex items-center gap-2 font-light">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.step1}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-light">
                  {t.dateLabel}
                </span>
                <input
                  type="date"
                  value={date}
                  min={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-[#111011] border border-white/10 focus:border-[#c5a880] px-4 py-3 text-sm text-[#f5f2eb] outline-none transition"
                />
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-light">
                  {t.shiftLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShift("lunch")}
                    className={`py-3 text-xs uppercase tracking-wider transition ${
                      shift === "lunch"
                        ? "bg-[#4a151b] text-white font-medium border border-[#4a151b]"
                        : "bg-[#111011] text-stone-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {lang === "es" ? "Almuerzo" : "Lunch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift("dinner")}
                    className={`py-3 text-xs uppercase tracking-wider transition ${
                      shift === "dinner"
                        ? "bg-[#4a151b] text-white font-medium border border-[#4a151b]"
                        : "bg-[#111011] text-stone-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {lang === "es" ? "Cena" : "Dinner"}
                  </button>
                </div>
              </div>
            </div>

            {/* Time slot picker */}
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-2 font-light flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#c5a880]" />
                <span>{t.timeLabel}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {(shift === "lunch" ? lunchTimes : dinnerTimes).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`px-4 py-2 text-xs font-mono transition ${
                      time === slot
                        ? "bg-[#4a151b] text-white border border-[#4a151b]"
                        : "bg-[#111011] text-stone-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {slot} hs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Guests and Contact */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <label className="text-[11px] uppercase tracking-[0.2em] text-[#c5a880] flex items-center gap-2 font-light">
              <Users className="w-3.5 h-3.5" />
              <span>{t.step2}</span>
            </label>

            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-2 font-light">
                {t.guestsLabel}
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {["1", "2", "3", "4", "5", "6", "7", "8+"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuests(num)}
                    className={`py-2 text-xs font-mono transition ${
                      guests === num
                        ? "bg-[#4a151b] text-white font-medium border border-[#4a151b]"
                        : "bg-[#111011] text-stone-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-light flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#c5a880]" />
                  <span>{t.nameLabel}</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  required
                  className="w-full bg-[#111011] border border-white/10 focus:border-[#c5a880] px-4 py-3 text-sm text-[#f5f2eb] outline-none transition"
                />
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-light flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#c5a880]" />
                  <span>{t.phoneLabel}</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full bg-[#111011] border border-white/10 focus:border-[#c5a880] px-4 py-3 text-sm text-[#f5f2eb] outline-none transition"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-light flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#c5a880]" />
                <span>{t.notesLabel}</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                rows={2}
                className="w-full bg-[#111011] border border-white/10 focus:border-[#c5a880] px-4 py-3 text-xs text-[#f5f2eb] outline-none transition resize-none font-light"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#4a151b] hover:bg-[#5a1b23] text-[#f5f2eb] py-4 text-xs uppercase tracking-[0.2em] font-medium transition duration-300 flex items-center justify-center gap-2 cursor-pointer border border-[#5a1b23]"
            >
              <span>{t.btnSubmit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-stone-500 font-light block mb-1">
                {t.directWhatsapp}
              </span>
              <a
                href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
                  lang === "es"
                    ? "¡Hola La Encontrada! Quisiera hacerles una consulta."
                    : "Hello La Encontrada! I have an inquiry."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c5a880] hover:text-white transition tracking-wider uppercase font-light"
              >
                {t.directWhatsappBtn}
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
