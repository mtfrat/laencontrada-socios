import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { normalizeSocioNumber } from "@/lib/socio-number";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const parsed = z.object({ numerosSocio: z.array(z.string().min(1)).min(1).max(100) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Ingresá al menos un número de socio válido." }, { status: 400 });
    }
    const numeros = [...new Set(parsed.data.numerosSocio.map(normalizeSocioNumber))];
    const socios = await prisma.socio.findMany({
      where: { numeroSocio: { in: numeros }, activo: true },
      select: { numeroSocio: true, nombre: true, apellido: true },
    });
    const found = new Set(socios.map((socio) => socio.numeroSocio.toUpperCase()));
    return NextResponse.json({
      success: true,
      socios,
      noEncontrados: numeros.filter((numero) => !found.has(numero)),
    });
  } catch (error) {
    console.error("Error validando socios del cierre:", error);
    return NextResponse.json({ success: false, error: "No se pudieron validar los socios." }, { status: 500 });
  }
}
