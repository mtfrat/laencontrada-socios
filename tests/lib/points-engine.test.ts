import { describe, expect, it } from "vitest";
import {
  calculateSurveyBonus,
  calculateTablePoints,
  isValidCouponCode,
} from "@/lib/points-engine";

describe("calculateTablePoints", () => {
  it("resuelve el ejemplo documentado: mesa de 4 con $100.000 a $1.000/punto", () => {
    const result = calculateTablePoints({
      totalTicket: 100000,
      guestCount: 4,
      pesosPorPunto: 1000,
    });

    expect(result).toEqual({
      gastoPromedioPorPersona: 25000,
      puntosPorSocio: 25,
    });
  });

  it("redondea el promedio a 2 decimales antes de dividir", () => {
    const result = calculateTablePoints({
      totalTicket: 2999.99,
      guestCount: 3,
      pesosPorPunto: 1000,
    });

    expect(result.gastoPromedioPorPersona).toBe(1000);
    expect(result.puntosPorSocio).toBe(1);
  });

  it("usa floor: un promedio bajo el ratio no aporta puntos", () => {
    const result = calculateTablePoints({
      totalTicket: 2999,
      guestCount: 3,
      pesosPorPunto: 1000,
    });

    expect(result.puntosPorSocio).toBe(0);
  });

  it("acredita puntos completos por cada unidad de ratio alcanzada", () => {
    const result = calculateTablePoints({
      totalTicket: 2500,
      guestCount: 2,
      pesosPorPunto: 400,
    });

    expect(result.gastoPromedioPorPersona).toBe(1250);
    expect(result.puntosPorSocio).toBe(3);
  });

  it("rechaza ticket sin monto", () => {
    expect(() =>
      calculateTablePoints({
        totalTicket: 0,
        guestCount: 4,
        pesosPorPunto: 1000,
      })
    ).toThrow(/mayor a 0/);

    expect(() =>
      calculateTablePoints({
        totalTicket: -1000,
        guestCount: 4,
        pesosPorPunto: 1000,
      })
    ).toThrow(/mayor a 0/);
  });

  it("rechaza menos de un comensal", () => {
    expect(() =>
      calculateTablePoints({
        totalTicket: 1000,
        guestCount: 0,
        pesosPorPunto: 1000,
      })
    ).toThrow(/al menos 1/);
  });

  it("rechaza ratio de pesos por punto inválido", () => {
    expect(() =>
      calculateTablePoints({
        totalTicket: 1000,
        guestCount: 4,
        pesosPorPunto: 0,
      })
    ).toThrow(/mayor a 0/);
  });
});

describe("calculateSurveyBonus", () => {
  it("aplica floor a valores decimales", () => {
    expect(calculateSurveyBonus(10.9)).toBe(10);
  });

  it("conserva enteros", () => {
    expect(calculateSurveyBonus(10)).toBe(10);
  });

  it("nunca devuelve negativos", () => {
    expect(calculateSurveyBonus(-100)).toBe(0);
    expect(calculateSurveyBonus(0)).toBe(0);
  });
});

describe("isValidCouponCode", () => {
  it("acepta códigos alfanuméricos de 6 a 16 caracteres", () => {
    expect(isValidCouponCode("ABC234")).toBe(true);
    expect(isValidCouponCode("abcdefgh1234")).toBe(true);
    expect(isValidCouponCode("  abc234  ")).toBe(true);
    expect(isValidCouponCode("CANJEABC234XYZ")).toBe(true);
  });

  it("rechaza códigos malformados", () => {
    expect(isValidCouponCode("")).toBe(false);
    expect(isValidCouponCode("ABC-234")).toBe(false);
    expect(isValidCouponCode("AB123")).toBe(false);
    expect(isValidCouponCode("A".repeat(17))).toBe(false);
    expect(isValidCouponCode(undefined as unknown as string)).toBe(false);
    expect(isValidCouponCode(null as unknown as string)).toBe(false);
  });
});
