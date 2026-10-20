import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const premios = await prisma.premio.findMany({
      orderBy: [{ activo: "desc" }, { puntosRequeridos: "asc" }],
      include: {
        _count: {
          select: { canjes: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      premios: premios.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        puntosRequeridos: p.puntosRequeridos,
        imagenUrl: p.imagenUrl,
        stock: p.stock,
        activo: p.activo,
        totalCanjes: p._count.canjes,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error al obtener premios:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar el catálogo de premios." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { titulo, descripcion, puntosRequeridos, stock, imagenUrl, activo } = body;

    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
      return NextResponse.json(
        { success: false, error: "El título del premio es obligatorio." },
        { status: 400 }
      );
    }

    const parsedPuntos = parseInt(puntosRequeridos, 10);
    if (isNaN(parsedPuntos) || parsedPuntos <= 0) {
      return NextResponse.json(
        { success: false, error: "Los puntos requeridos deben ser un número mayor a 0." },
        { status: 400 }
      );
    }

    const parsedStock = stock !== undefined && stock !== null ? parseInt(stock, 10) : -1;

    const nuevoPremio = await prisma.premio.create({
      data: {
        titulo: titulo.trim(),
        descripcion: (descripcion || "").trim(),
        puntosRequeridos: parsedPuntos,
        stock: isNaN(parsedStock) ? -1 : parsedStock,
        imagenUrl: imagenUrl && typeof imagenUrl === "string" && imagenUrl.trim() ? imagenUrl.trim() : null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    });

    return NextResponse.json({
      success: true,
      premio: nuevoPremio,
      message: "Premio creado exitosamente.",
    });
  } catch (error) {
    console.error("Error al crear premio:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar el nuevo premio." },
      { status: 500 }
    );
  }
}