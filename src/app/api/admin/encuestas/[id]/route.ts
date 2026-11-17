import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        texto: z.string().trim().min(3, "El texto de la pregunta no puede estar vacío.").optional(),
        categoria: z.string().trim().optional(),
        activa: z.boolean().optional(),
        orden: z.coerce.number().int().optional(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { texto, categoria, activa, orden } = campos.data;

    const actualizada = await prisma.preguntaEncuesta.update({
      where: { id },
      data: {
        texto,
        categoria: categoria !== undefined ? categoria.toUpperCase() : undefined,
        activa,
        orden,
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
