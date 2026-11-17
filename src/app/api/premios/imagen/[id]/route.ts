import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const premio = await prisma.premio.findUnique({
    where: { id },
    select: { imagenData: true, imagenMime: true },
  });
  if (!premio?.imagenData || !premio.imagenMime) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(premio.imagenData), {
    headers: {
      "Content-Type": premio.imagenMime,
      "Content-Length": String(premio.imagenData.length),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
