import { describe, expect, it } from "vitest";
import { buildReservationMessage } from "@/lib/reservation-message";

describe("mensaje de reserva", () => {
  it("pide disponibilidad en español con fecha legible y sin horario inventado", () => {
    const message = buildReservationMessage({
      date: "2026-11-06", shift: "dinner", guests: 2, name: "Ana Pérez", lang: "es",
    });
    expect(message).toContain("viernes, 6 de noviembre de 2026");
    expect(message).toContain("2 personas");
    expect(message).toContain("para cenar");
    expect(message).toContain("Ana Pérez");
    expect(message).toContain("¿Tienen disponibilidad?");
    expect(message).not.toMatch(/\b\d{2}:\d{2}\b/);
  });

  it("adapta singular y turno en inglés", () => {
    const message = buildReservationMessage({
      date: "2026-11-06", shift: "lunch", guests: 1, name: " Sam ", lang: "en",
    });
    expect(message).toContain("Friday, November 6, 2026");
    expect(message).toContain("1 guest");
    expect(message).toContain("for lunch");
    expect(message).toContain("under Sam");
  });
});
