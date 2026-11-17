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
      z
        .object({
          titulo: z
            .string({ error: "El título no puede estar vacío." })
            .trim()
            .min(1, "El título no puede estar vacío.")
            .optional(),
          descripcion: z.string().optional(),
          puntosRequeridos: z.coerce
            .number({ error: "Los puntos deben ser un número mayor a 0." })
            .int("Los puntos deben ser un número mayor a 0.")
            .positive("Los puntos deben ser un número mayor a 0.")
            .optional(),
          stock: z.coerce.number().int().nullish(),
          imagenUrl: z.string().nullish(),
          activo: z.boolean().optional(),
        }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { titulo, descripcion, puntosRequeridos, stock, imagenUrl, activo } =
      campos.data;

    const dataToUpdate: Record<string, unknown> = {};

    if (titulo !== undefined) {
      dataToUpdate.titulo = titulo;
    }

    if (descripcion !== undefined) {
      dataToUpdate.descripcion = descripcion.trim();
    }

    if (puntosRequeridos !== undefined) {
      dataToUpdate.puntosRequeridos = puntosRequeridos;
    }

    if (stock !== undefined) {
      dataToUpdate.stock = stock ?? -1;
    }

    if (imagenUrl !== undefined) {
      dataToUpdate.imagenUrl = imagenUrl && imagenUrl.trim() ? imagenUrl.trim() : null;
    }

    if (activo !== undefined) {
      dataToUpdate.activo = activo;
    }

    const premioActualizado = await prisma.premio.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, titulo: true, imagenUrl: true },
    });

    return NextResponse.json({
      success: true,
      premio: premioActualizado,
      message: "Premio actualizado exitosamente.",
    });
  } catch (error) {
    console.error("Error al actualizar premio:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar los datos del premio." },
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

    // Verificar si tiene canjes asociados
    const canjesCount = await prisma.canjePremio.count({
      where: { premioId: id },
    });

    if (canjesCount > 0) {
      // Si tiene historial, desactivamos (baja lógica)
      await prisma.premio.update({
        where: { id },
        data: { activo: false },
      });
      return NextResponse.json({
        success: true,
        desactivado: true,
        message: "El premio tiene canjes históricos asociados; fue desactivado para preservar la integridad.",
      });
    }

    // Si no tiene canjes, eliminación completa
    await prisma.premio.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Premio eliminado definitivamente.",
    });
  } catch (error) {
    console.error("Error al eliminar premio:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el premio." },
      { status: 500 }
    );
  }
}
