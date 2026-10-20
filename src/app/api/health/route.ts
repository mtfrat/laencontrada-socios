import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[health] DATABASE_URL no está configurada en las variables de entorno."
    );
    return NextResponse.json(
      { status: "ERROR", code: "CONFIG_MISSING" },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "OK",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] Error de conexión con la base de datos:", error);
    return NextResponse.json(
      { status: "ERROR", code: "DB_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
