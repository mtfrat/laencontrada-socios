import { afterEach, describe, expect, it, vi } from "vitest";
import { assertLocalReviewDatabase } from "../../scripts/assert-local-review-db";

afterEach(() => vi.unstubAllEnvs());

describe("assertLocalReviewDatabase", () => {
  it("admite la base aislada en loopback", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:55432/laencontrada_review");
    expect(assertLocalReviewDatabase).not.toThrow();
  });

  it("rechaza destinos externos y otras bases locales", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@database.example.com/laencontrada_review");
    expect(assertLocalReviewDatabase).toThrow(/base local/);

    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/postgres");
    expect(assertLocalReviewDatabase).toThrow(/base local/);
  });
});
