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
    const { titulo, descripcion, puntosRequeridos, stock, imagenUrl, activo } = body;

    const dataToUpdate: Record<string, unknown> = {};

    if (titulo !== undefined) {
      if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
        return NextResponse.json(
          { success: false, error: "El título no puede estar vacío." },
          { status: 400 }
        );
      }
      dataToUpdate.titulo = titulo.trim();
    }

    if (descripcion !== undefined) {
      dataToUpdate.descripcion = String(descripcion).trim();
    }

    if (puntosRequeridos !== undefined) {
      const parsed = parseInt(puntosRequeridos, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json(
          { success: false, error: "Los puntos deben ser un número mayor a 0." },
          { status: 400 }
        );
      }
      dataToUpdate.puntosRequeridos = parsed;
    }

    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      dataToUpdate.stock = isNaN(parsedStock) ? -1 : parsedStock;
    }

    if (imagenUrl !== undefined) {
      dataToUpdate.imagenUrl = imagenUrl && String(imagenUrl).trim() ? String(imagenUrl).trim() : null;
    }

    if (activo !== undefined) {
      dataToUpdate.activo = Boolean(activo);
    }

    const premioActualizado = await prisma.premio.update({
      where: { id },
      data: dataToUpdate,
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
    const session = auth.session;

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