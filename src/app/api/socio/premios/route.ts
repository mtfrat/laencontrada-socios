import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSocioSession } from "@/lib/auth";
import { EstadoCanje } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSocioSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const socio = await prisma.socio.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        puntosActuales: true,
        puntosHistoricos: true,
      },
    });

    if (!socio) {
      return NextResponse.json({ success: false, error: "Socio no encontrado" }, { status: 404 });
    }

    const now = new Date();

    // Actualizar canjes pendientes vencidos a EXPIRADO
    await prisma.canjePremio.updateMany({
      where: {
        socioId: socio.id,
        estado: EstadoCanje.PENDIENTE,
        fechaExpiracion: { lt: now },
      },
      data: { estado: EstadoCanje.EXPIRADO },
    });

    // Obtener canje activo pendiente (si tiene alguno vigente)
    const canjeActivo = await prisma.canjePremio.findFirst({
      where: {
        socioId: socio.id,
        estado: EstadoCanje.PENDIENTE,
        fechaExpiracion: { gt: now },
      },
      include: {
        premio: {
          select: { id: true, titulo: true, puntosRequeridos: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular puntos retenidos en canjes pendientes vigentes
    const puntosRetenidos = canjeActivo ? canjeActivo.puntosGastados : 0;
    const puntosDisponibles = Math.max(0, socio.puntosActuales - puntosRetenidos);

    // Obtener todos los premios activos
    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { puntosRequeridos: "asc" },
    });

    const premiosFormateados = premios.map((p) => {
      const tieneStock = p.stock === -1 || p.stock > 0;
      const puedeCanjear = tieneStock && puntosDisponibles >= p.puntosRequeridos;
      const puntosFaltantes = Math.max(0, p.puntosRequeridos - puntosDisponibles);

      return {
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        puntosRequeridos: p.puntosRequeridos,
        imagenUrl: p.imagenUrl,
        stock: p.stock,
        tieneStock,
        puedeCanjear,
        puntosFaltantes,
      };
    });

    return NextResponse.json({
      success: true,
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        puntosActuales: socio.puntosActuales,
        puntosDisponibles,
        puntosRetenidos,
        canjeActivo: canjeActivo
          ? {
              id: canjeActivo.id,
              codigoQR: canjeActivo.codigoQR,
              premioTitulo: canjeActivo.premio.titulo,
              puntosGastados: canjeActivo.puntosGastados,
              fechaExpiracion: canjeActivo.fechaExpiracion,
            }
          : null,
      },
      premios: premiosFormateados,
    });
  } catch (error) {
    console.error("Error al obtener catálogo de premios del socio:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar los premios disponibles." },
      { status: 500 }
    );
  }
}