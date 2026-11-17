export type ReservationShift = "lunch" | "dinner";

export function buildReservationMessage({
  date,
  shift,
  guests,
  name,
  lang,
}: {
  date: string;
  shift: ReservationShift;
  guests: number;
  name: string;
  lang: "es" | "en";
}): string {
  const [year, month, day] = date.split("-").map(Number);
  const dateText = new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));

  if (lang === "es") {
    return `Hola, quisiera pedir una mesa para ${guests} ${guests === 1 ? "persona" : "personas"} el ${dateText}, para ${shift === "lunch" ? "almorzar" : "cenar"}. La reserva sería a nombre de ${name.trim()}. ¿Tienen disponibilidad?`;
  }

  return `Hello, I'd like to request a table for ${guests} ${guests === 1 ? "guest" : "guests"} on ${dateText} for ${shift === "lunch" ? "lunch" : "dinner"}. The booking would be under ${name.trim()}. Do you have availability?`;
}
