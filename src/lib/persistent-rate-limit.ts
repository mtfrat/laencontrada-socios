import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export interface PersistentRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** A single atomic PostgreSQL upsert keeps the counter shared across Vercel instances. */
export async function hitPersistentRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<PersistentRateLimitDecision> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET no está configurado");
  const key = createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex");
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "AuthRateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${nextReset})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "AuthRateLimit"."resetAt" <= ${now} THEN 1
        ELSE "AuthRateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "AuthRateLimit"."resetAt" <= ${now} THEN ${nextReset}
        ELSE "AuthRateLimit"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;
  const row = rows[0];
  if (!row) throw new Error("No se pudo registrar el límite de acceso");
  if (Math.random() < 0.002) {
    // Limpieza eventual: los contadores vencidos no deben crecer sin límite.
    await prisma.authRateLimit.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } })
      .catch((error) => console.warn("No se pudieron limpiar los límites de acceso:", error instanceof Error ? error.message : String(error)));
  }
  return {
    allowed: row.count <= limit,
    retryAfterSeconds: row.count <= limit ? 0 : Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
  };
}
