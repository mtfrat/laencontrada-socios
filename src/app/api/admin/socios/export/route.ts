import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const socios = await prisma.socio.findMany({
      orderBy: { numeroSocio: "asc" },
      select: {
        numeroSocio: true,
        dni: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        puntosActuales: true,
        puntosHistoricos: true,
        activo: true,
        fechaAlta: true,
        _count: {
          select: {
            visitas: true,
            canjes: true,
          },
        },
      },
    });

    // Helper para escapar campos CSV
    const escapeCsv = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = [
      "Numero_Socio",
      "DNI",
      "Nombre",
      "Apellido",
      "Telefono",
      "Email",
      "Puntos_Actuales",
      "Puntos_Historicos",
      "Visitas_Totales",
      "Canjes_Totales",
      "Estado",
      "Fecha_Alta",
    ].join(";");

    const rows = socios.map((s) => {
      return [
        escapeCsv(s.numeroSocio),
        escapeCsv(s.dni),
        escapeCsv(s.nombre),
        escapeCsv(s.apellido || ""),
        escapeCsv(s.telefono || ""),
        escapeCsv(s.email || ""),
        s.puntosActuales,
        s.puntosHistoricos,
        s._count.visitas,
        s._count.canjes,
        escapeCsv(s.activo ? "Activo" : "Pausado"),
        escapeCsv(new Date(s.fechaAlta).toLocaleDateString("es-AR")),
      ].join(";");
    });

    // Añadimos UTF-8 BOM (\uFEFF) para que Excel lo interprete en UTF-8 directamente sin problemas de tildes
    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");

    const today = new Date().toISOString().split("T")[0];
    const filename = `socios-la-encontrada-${today}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar socios CSV:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar la exportación." },
      { status: 500 }
    );
  }
}
