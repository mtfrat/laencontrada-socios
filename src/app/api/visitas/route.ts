import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(request.url);
    const socioId = searchParams.get("socioId");
    const query = searchParams.get("q")?.trim();

    const whereClause: Record<string, unknown> = {};

    if (socioId) {
      whereClause.socioId = socioId;
    }

    if (query) {
      whereClause.socio = {
        OR: [
          { dni: { contains: query, mode: "insensitive" } },
          { nombre: { contains: query, mode: "insensitive" } },
          { apellido: { contains: query, mode: "insensitive" } },
        ],
      };
    }

    const visitas = await prisma.visitaConsumo.findMany({
      where: whereClause,
      include: {
        socio: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            numeroSocio: true,
          },
        },
        registradoPor: {
          select: {
            id: true,
            nombre: true,
            username: true,
          },
        },
        platos: true,
        ticketAdjunto: true,
      },
      orderBy: { fechaVisita: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, visitas });
  } catch (error) {
    console.error("Error obteniendo visitas:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el historial de visitas." },
      { status: 500 }
    );
  }
}
