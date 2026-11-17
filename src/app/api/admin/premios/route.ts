import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const premios = await prisma.premio.findMany({
      orderBy: [{ activo: "desc" }, { puntosRequeridos: "asc" }],
      select: {
        id: true, titulo: true, descripcion: true, puntosRequeridos: true,
        imagenUrl: true, stock: true, activo: true, createdAt: true,
        _count: {
          select: { canjes: { where: { estado: "COMPLETADO" } } },
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

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        titulo: z
          .string({ error: "El título del premio es obligatorio." })
          .trim()
          .min(1, "El título del premio es obligatorio."),
        descripcion: z.string().trim().optional(),
        puntosRequeridos: z.coerce
          .number({
            error: "Los puntos requeridos deben ser un número mayor a 0.",
          })
          .int("Los puntos requeridos deben ser un número mayor a 0.")
          .positive("Los puntos requeridos deben ser un número mayor a 0."),
        stock: z.coerce.number().int().nullish(),
        imagenUrl: z.string().trim().optional(),
        activo: z.boolean().optional(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const {
      titulo,
      descripcion,
      puntosRequeridos: parsedPuntos,
      stock,
      imagenUrl,
      activo,
    } = campos.data;

    const parsedStock = stock ?? -1;

    const nuevoPremio = await prisma.premio.create({
      data: {
        titulo: titulo.trim(),
        descripcion: (descripcion || "").trim(),
        puntosRequeridos: parsedPuntos,
        stock: parsedStock,
        imagenUrl: imagenUrl || null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
      select: { id: true, titulo: true },
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
