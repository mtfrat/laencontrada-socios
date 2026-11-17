"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, X } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import { RESTAURANT_INFO, CONTENT } from "@/data/landing-content";
import { restaurantDate } from "@/lib/reservation-date";
import { buildReservationMessage, type ReservationShift } from "@/lib/reservation-message";
import styles from "./ReservationModal.module.css";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "es" | "en";
}

export default function ReservationModal({ isOpen, onClose, lang = "es" }: ReservationModalProps) {
  const t = CONTENT[lang].modal;
  const [date, setDate] = useState("");
  const [shift, setShift] = useState<ReservationShift>("dinner");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const count = Number(guests);
    if (!date || date < restaurantDate()) {
      setError(t.dateError);
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 100 || !name.trim()) {
      setError(t.detailsError);
      return;
    }

    setError("");
    const message = buildReservationMessage({ date, shift, guests: count, name, lang });
    window.location.assign(`https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`);
  };

  const directMessage = lang === "es"
    ? "Hola, quisiera consultar disponibilidad para reservar una mesa."
    : "Hello, I'd like to check availability for a table.";

  return (
    <Dialog open={isOpen} onClose={onClose} labelledBy="reservation-title" className="max-w-md">
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>La Encontrada · Wine Bistro</span>
          <button type="button" onClick={onClose} aria-label={t.cancel} className={styles.close}><X size={20} /></button>
          <h2 id="reservation-title" className={styles.title}>{t.title}</h2>
          <p className={styles.intro}>{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reservation-date">{t.dateLabel}</label>
              <input id="reservation-date" type="date" min={restaurantDate()} value={date} onChange={(event) => { setDate(event.target.value); setError(""); }} required className={styles.input} />
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-guests">{t.guestsLabel}</label>
              <input id="reservation-guests" type="number" inputMode="numeric" min="1" max="100" step="1" value={guests} onChange={(event) => { setGuests(event.target.value); setError(""); }} required className={styles.input} />
            </div>
          </div>

          <fieldset className={styles.shift}>
            <legend>{t.shiftLabel}</legend>
            <div className={styles.shiftOptions}>
              <label className={`${styles.shiftOption} ${shift === "lunch" ? styles.shiftOptionSelected : ""}`}><input type="radio" name="reservation-shift" value="lunch" checked={shift === "lunch"} onChange={() => setShift("lunch")} />{t.shiftLunch}</label>
              <label className={`${styles.shiftOption} ${shift === "dinner" ? styles.shiftOptionSelected : ""}`}><input type="radio" name="reservation-shift" value="dinner" checked={shift === "dinner"} onChange={() => setShift("dinner")} />{t.shiftDinner}</label>
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="reservation-name">{t.nameLabel}</label>
            <input id="reservation-name" type="text" autoComplete="name" maxLength={100} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder={t.namePlaceholder} required className={styles.input} />
          </div>

          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit}>{t.btnSubmit}<ArrowUpRight size={18} /></button>
          <p className={styles.confirmation}>{t.confirmation}</p>
        </form>

        <a className={styles.direct} href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(directMessage)}`} target="_blank" rel="noopener noreferrer">{t.directWhatsappBtn}<ArrowUpRight size={15} /></a>
      </div>
    </Dialog>
  );
}
