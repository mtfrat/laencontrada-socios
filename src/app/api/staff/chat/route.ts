import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { readJsonBody, validate } from "@/lib/validation";
import { FixedWindowRateLimiter } from "@/lib/rate-limit";

const chatLimiter = new FixedWindowRateLimiter(30, 60_000);

export async function GET() {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;

    const latest = await prisma.mensajeInterno.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
      select: { id: true, autorId: true, autorNombre: true, contenido: true, createdAt: true },
    });
    return NextResponse.json({ success: true, mensajes: latest.reverse(), usuarioId: auth.session.id }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Error al leer chat interno:", error);
    return NextResponse.json({ success: false, error: "No se pudo cargar el chat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const validated = validate(z.object({
      contenido: z.string().trim().min(1, "Escribí un mensaje.").max(2000, "El mensaje no puede superar los 2000 caracteres."),
    }), parsed.data);
    if (!validated.ok) return validated.response;

    const limit = chatLimiter.hit(auth.session.id);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "Estás enviando mensajes muy rápido. Intentá de nuevo en un minuto." }, {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const mensaje = await prisma.mensajeInterno.create({
      data: {
        autorId: auth.session.id,
        autorNombre: auth.session.nombre,
        contenido: validated.data.contenido,
      },
      select: { id: true, autorId: true, autorNombre: true, contenido: true, createdAt: true },
    });
    return NextResponse.json({ success: true, mensaje }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error al enviar mensaje interno:", error);
    return NextResponse.json({ success: false, error: "No se pudo enviar el mensaje." }, { status: 500 });
  }
}
