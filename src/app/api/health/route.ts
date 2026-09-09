import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    nodeEnv: process.env.NODE_ENV,
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: "ERROR",
        motivo: "DATABASE_URL no está configurada en las Variables de Entorno de Vercel.",
        solucion: "Ve a Vercel > Settings > Environment Variables, agrega DATABASE_URL y luego haz Redeploy.",
        envCheck,
      },
      { status: 500 }
    );
  }

  try {
    const totalSocios = await prisma.socio.count();
    const config = await prisma.configuracionPuntos.findFirst();

    return NextResponse.json({
      status: "OK",
      mensaje: "Conexión con Supabase y servidor Next.js exitosa.",
      totalSocios,
      pesosPorPunto: config?.pesosPorPunto || 1000,
      envCheck,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "ERROR_CONEXION_BASE_DATOS",
        mensaje: "Error al conectar con la base de datos Supabase.",
        errorDetalle: error?.message || String(error),
        envCheck,
      },
      { status: 500 }
    );
  }
}
