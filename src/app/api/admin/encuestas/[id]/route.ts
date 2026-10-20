import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await params;
    const body = await request.json();
    const { texto, categoria, activa, orden } = body;

    const actualizada = await prisma.preguntaEncuesta.update({
      where: { id },
      data: {
        texto: texto !== undefined ? String(texto).trim() : undefined,
        categoria: categoria !== undefined ? String(categoria).trim().toUpperCase() : undefined,
        activa: activa !== undefined ? Boolean(activa) : undefined,
        orden: orden !== undefined ? Number(orden) : undefined,
      },
    });

    return NextResponse.json({ success: true, pregunta: actualizada });
  } catch (error) {
    console.error("Error actualizando pregunta:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la pregunta." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await params;

    // Verificar si ya tiene respuestas asociadas
    const tieneRespuestas = await prisma.itemRespuestaEncuesta.count({
      where: { preguntaId: id },
    });

    if (tieneRespuestas > 0) {
      // Si ya tiene respuestas, la desactivamos en vez de borrar para preservar integridad histórica
      await prisma.preguntaEncuesta.update({
        where: { id },
        data: { activa: false },
      });
      return NextResponse.json({
        success: true,
        message: "La pregunta tiene respuestas históricas registradas, por lo que fue desactivada.",
      });
    }

    await prisma.preguntaEncuesta.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Pregunta eliminada exitosamente." });
  } catch (error) {
    console.error("Error eliminando pregunta:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la pregunta." },
      { status: 500 }
    );
  }
}
