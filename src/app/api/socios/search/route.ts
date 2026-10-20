import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, socios: [] });
    }

    const cleanQuery = query.replace(/[.\-\s]/g, "");

    const socios = await prisma.socio.findMany({
      where: {
        activo: true,
        OR: [
          { dni: { contains: cleanQuery, mode: "insensitive" } },
          { numeroSocio: { contains: query, mode: "insensitive" } },
          { nombre: { contains: query, mode: "insensitive" } },
          { apellido: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        numeroSocio: true,
        puntosActuales: true,
      },
      take: 8,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ success: true, socios });
  } catch (error) {
    console.error("Error buscando socios:", error);
    return NextResponse.json(
      { success: false, error: "Error al buscar socios." },
      { status: 500 }
    );
  }
}
