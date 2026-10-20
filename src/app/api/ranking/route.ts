import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSocioSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSocioSession();

    // Obtener Top 20 socios con mayor puntaje histórico
    const topSocios = await prisma.socio.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        numeroSocio: true,
        puntosHistoricos: true,
        puntosActuales: true,
      },
      orderBy: { puntosHistoricos: "desc" },
      take: 20,
    });

    // Formatear nombres para privacidad (ej: Juan P.)
    const ranking = topSocios.map((s, index) => {
      const inicialApellido = s.apellido && s.apellido.trim().length > 0
        ? ` ${s.apellido.trim().charAt(0).toUpperCase()}.`
        : "";
      return {
        posicion: index + 1,
        id: s.id,
        nombrePublico: `${s.nombre.trim()}${inicialApellido}`,
        numeroSocio: s.numeroSocio,
        puntosHistoricos: s.puntosHistoricos,
        esSocioActual: session?.id === s.id,
      };
    });

    // Calcular posición del socio actual si no está en el top 20
    let miPosicion = null;
    if (session) {
      const socioActual = await prisma.socio.findUnique({
        where: { id: session.id },
        select: { id: true, puntosHistoricos: true },
      });

      if (socioActual) {
        const sociosPorDelante = await prisma.socio.count({
          where: {
            activo: true,
            puntosHistoricos: { gt: socioActual.puntosHistoricos },
          },
        });
        miPosicion = sociosPorDelante + 1;
      }
    }

    return NextResponse.json({
      success: true,
      ranking,
      miPosicion,
    });
  } catch (error) {
    console.error("Error obteniendo ranking:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el ranking de fidelidad." },
      { status: 500 }
    );
  }
}
