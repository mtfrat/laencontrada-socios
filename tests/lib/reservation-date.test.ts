import { describe, expect, it } from "vitest";
import { restaurantDate } from "@/lib/reservation-date";

describe("calendario de reservas en Argentina", () => {
  it("mantiene el día local después de medianoche UTC", () => {
    expect(restaurantDate(new Date("2026-10-30T01:30:00Z"))).toBe("2026-10-29");
  });
  it("cambia de día y año a medianoche de Argentina", () => {
    expect(restaurantDate(new Date("2027-01-01T02:59:59Z"))).toBe("2026-12-31");
    expect(restaurantDate(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
  });
});
