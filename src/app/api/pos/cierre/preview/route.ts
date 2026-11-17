import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { parseUploadedCierre } from "@/lib/cierre-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const { cierre } = await parseUploadedCierre(request);
    const [config, credited, linked] = await Promise.all([
      prisma.configuracionPuntos.findFirst({ select: { pesosPorPunto: true } }),
      prisma.ticketAcreditado.findMany({
        where: { numeroFactura: { in: cierre.tickets.map((ticket) => ticket.numeroFactura) } },
        select: { numeroFactura: true },
      }),
      prisma.ticketAdjunto.findMany({
        where: { numeroTicketFiscal: { in: cierre.tickets.map((ticket) => ticket.numeroFactura) } },
        select: { numeroTicketFiscal: true },
      }),
    ]);
    const facturasAcreditadas = new Set(credited.map((ticket) => ticket.numeroFactura));
    const facturasVinculadas = new Set(linked.map((ticket) => ticket.numeroTicketFiscal));
    return NextResponse.json({
      success: true,
      pesosPorPunto: Number(config?.pesosPorPunto ?? 1000),
      cierre: {
        ...cierre,
        tickets: cierre.tickets.map((ticket) => ({
          ...ticket,
          yaAcreditado: facturasAcreditadas.has(ticket.numeroFactura) || facturasVinculadas.has(ticket.numeroFactura),
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && /PDF|cierre|factura|importe|ventas|50 páginas|100 facturas/i.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Error previsualizando cierre de turno:", error);
    return NextResponse.json({ success: false, error: "No se pudo leer el cierre de turno." }, { status: 500 });
  }
}
