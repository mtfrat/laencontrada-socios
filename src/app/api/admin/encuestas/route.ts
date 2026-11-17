import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const [preguntas, config] = await Promise.all([
      prisma.preguntaEncuesta.findMany({
        orderBy: { orden: "asc" },
      }),
      prisma.configuracionPuntos.findFirst(),
    ]);

    return NextResponse.json({
      success: true,
      preguntas,
      puntosPorEncuesta: config?.puntosPorEncuesta || 10,
    });
  } catch (error) {
    console.error("Error obteniendo preguntas de encuesta:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las preguntas." },
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
        texto: z
          .string({ error: "El texto de la pregunta es obligatorio." })
          .trim()
          .min(3, "El texto de la pregunta es obligatorio."),
        categoria: z.string().trim().optional(),
        orden: z.unknown().optional(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { texto, categoria, orden } = campos.data;

    const count = await prisma.preguntaEncuesta.count();

    const nuevaPregunta = await prisma.preguntaEncuesta.create({
      data: {
        texto,
        categoria: categoria ? categoria.toUpperCase() : "GENERAL",
        orden: orden !== undefined ? Number(orden) : count + 1,
        activa: true,
      },
    });

    return NextResponse.json({ success: true, pregunta: nuevaPregunta });
  } catch (error) {
    console.error("Error creando pregunta de encuesta:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la pregunta." },
      { status: 500 }
    );
  }
}
