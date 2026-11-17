import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/guards";

const MAX_BYTES = 2 * 1024 * 1024;

function validImage(bytes: Uint8Array, type: string): boolean {
  if (type === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const premio = await prisma.premio.findUnique({ where: { id }, select: { id: true } });
    if (!premio) return NextResponse.json({ success: false, error: "Premio no encontrado." }, { status: 404 });

    const form = await request.formData();
    const file = form.get("imagen");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Elegí una imagen JPG, PNG o WebP de hasta 2 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validImage(bytes, file.type)) {
      return NextResponse.json({ success: false, error: "El archivo no es una imagen JPG, PNG o WebP válida." }, { status: 400 });
    }

    const imagenUrl = `/api/premios/imagen/${id}?v=${Date.now()}`;
    await prisma.premio.update({
      where: { id },
      data: { imagenData: bytes, imagenMime: file.type, imagenUrl },
    });
    return NextResponse.json({ success: true, imagenUrl });
  } catch (error) {
    console.error("Error al cargar imagen de premio:", error);
    return NextResponse.json({ success: false, error: "No se pudo guardar la imagen." }, { status: 500 });
  }
}
