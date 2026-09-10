import { PrismaClient } from "@prisma/client";

function sanitizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;
  let url = rawUrl.trim();

  // Strip wrapping double or single quotes
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  // If user accidentally pasted "DATABASE_URL=..." as the value
  if (url.startsWith("DATABASE_URL=")) {
    url = url.replace(/^DATABASE_URL=/, "").trim();
    if (
      (url.startsWith('"') && url.endsWith('"')) ||
      (url.startsWith("'") && url.endsWith("'"))
    ) {
      url = url.slice(1, -1).trim();
    }
  }

  // If protocol was omitted
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    if (url.includes("@") || url.includes("supabase.co") || url.includes(":5432") || url.includes(":6543")) {
      url = "postgresql://" + url;
    }
  }

  return url;
}

const cleanedUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);
if (cleanedUrl && process.env.DATABASE_URL !== cleanedUrl) {
  process.env.DATABASE_URL = cleanedUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: cleanedUrl ? { db: { url: cleanedUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

