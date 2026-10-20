import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("FixedWindowRateLimiter", () => {
  it("permite intentos hasta el límite y bloquea el exceso", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    const t0 = 1_000_000;

    const first = limiter.hit("key", t0);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    expect(limiter.hit("key", t0 + 10).allowed).toBe(true);

    const third = limiter.hit("key", t0 + 20);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const blocked = limiter.hit("key", t0 + 30);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(blocked.limit).toBe(3);
  });

  it("reinicia la ventana cuando expira", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    const t0 = 5_000_000;

    expect(limiter.hit("key", t0).allowed).toBe(true);
    expect(limiter.hit("key", t0 + 59_999).allowed).toBe(false);
    expect(limiter.hit("key", t0 + 60_001).allowed).toBe(true);
  });

  it("mantiene claves independientes", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    const t0 = 0;

    expect(limiter.hit("a", t0).allowed).toBe(true);
    expect(limiter.hit("b", t0 + 1).allowed).toBe(true);
    expect(limiter.hit("a", t0 + 2).allowed).toBe(false);
    expect(limiter.hit("b", t0 + 3).allowed).toBe(false);
  });

  it("calcula retryAfterSeconds como el tiempo restante de la ventana", () => {
    const limiter = new FixedWindowRateLimiter(1, 10_000);

    limiter.hit("key", 0);
    const blocked = limiter.hit("key", 4_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(6);
  });

  it("reset limpia una clave específica o todas", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    const t0 = 0;

    limiter.hit("a", t0);
    limiter.hit("b", t0);
    expect(limiter.hit("a", t0 + 1).allowed).toBe(false);

    limiter.reset("a");
    expect(limiter.hit("a", t0 + 2).allowed).toBe(true);
    expect(limiter.hit("b", t0 + 3).allowed).toBe(false);

    limiter.reset();
    expect(limiter.size).toBe(0);
    expect(limiter.hit("b", t0 + 4).allowed).toBe(true);
  });

  it("descarta buckets expirados para no crecer sin límite", () => {
    const limiter = new FixedWindowRateLimiter(5, 1_000);

    limiter.hit("old", 0);
    limiter.hit("old", 500);
    expect(limiter.size).toBe(1);

    limiter.hit("new", 10_000);
    expect(limiter.size).toBe(1);
  });
});

describe("getClientIp", () => {
  it("usa el primer salto de x-forwarded-for", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("usa x-real-ip como alternativa", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-real-ip": "203.0.113.8" },
    });
    expect(getClientIp(request)).toBe("203.0.113.8");
  });

  it("devuelve unknown sin cabeceras de red", () => {
    const request = new Request("http://localhost/api");
    expect(getClientIp(request)).toBe("unknown");
  });
});
