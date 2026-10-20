import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

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
    const session = auth.session;

    const body = await request.json();
    const { texto, categoria, orden } = body;

    if (!texto || String(texto).trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "El texto de la pregunta es obligatorio." },
        { status: 400 }
      );
    }

    const count = await prisma.preguntaEncuesta.count();

    const nuevaPregunta = await prisma.preguntaEncuesta.create({
      data: {
        texto: String(texto).trim(),
        categoria: categoria ? String(categoria).trim().toUpperCase() : "GENERAL",
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
