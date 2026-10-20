import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { dni, nombre, apellido, telefono, email } = body;

    if (!dni || typeof dni !== "string") {
      return NextResponse.json(
        { success: false, error: "El número de DNI es obligatorio." },
        { status: 400 }
      );
    }

    const cleanDni = dni.replace(/\D/g, "").trim();
    if (cleanDni.length < 5) {
      return NextResponse.json(
        { success: false, error: "El DNI debe tener al menos 5 dígitos válidos." },
        { status: 400 }
      );
    }

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del socio es obligatorio." },
        { status: 400 }
      );
    }

    // Comprobar si ya existe por DNI
    const existing = await prisma.socio.findUnique({
      where: { dni: cleanDni },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        yaExistia: true,
        socio: {
          id: existing.id,
          numeroSocio: existing.numeroSocio,
          dni: existing.dni,
          nombre: existing.nombre,
          apellido: existing.apellido,
          puntosActuales: existing.puntosActuales,
        },
        message: `El socio ya se encontraba registrado (${existing.nombre} ${existing.apellido || ""}).`,
      });
    }

    // Calcular el siguiente número de socio correlativo, reintentando ante
    // colisiones concurrentes (dni o numeroSocio son únicos en la base)
    let nuevoSocio = null;
    for (let intento = 0; intento < 3 && !nuevoSocio; intento++) {
      const allSocios = await prisma.socio.findMany({
        select: { numeroSocio: true },
      });

      let maxNum = 1000;
      for (const s of allSocios) {
        const match = s.numeroSocio.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      let nextNum = maxNum + 1;
      let nextNumSocio = `SOC-${nextNum}`;

      while (allSocios.some((s) => s.numeroSocio === nextNumSocio)) {
        nextNum++;
        nextNumSocio = `SOC-${nextNum}`;
      }

      try {
        nuevoSocio = await prisma.socio.create({
          data: {
            numeroSocio: nextNumSocio,
            dni: cleanDni,
            nombre: nombre.trim(),
            apellido: apellido && typeof apellido === "string" ? apellido.trim() : null,
            telefono: telefono && typeof telefono === "string" && telefono.trim() ? telefono.trim() : null,
            email: email && typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null,
            puntosActuales: 0,
            puntosHistoricos: 0,
            activo: true,
          },
          select: {
            id: true,
            numeroSocio: true,
            dni: true,
            nombre: true,
            apellido: true,
            puntosActuales: true,
          },
        });
      } catch (error) {
        if ((error as { code?: string })?.code !== "P2002") {
          throw error;
        }
        const porDni = await prisma.socio.findUnique({
          where: { dni: cleanDni },
        });
        if (porDni) {
          return NextResponse.json({
            success: true,
            yaExistia: true,
            socio: {
              id: porDni.id,
              numeroSocio: porDni.numeroSocio,
              dni: porDni.dni,
              nombre: porDni.nombre,
              apellido: porDni.apellido,
              puntosActuales: porDni.puntosActuales,
            },
            message: `El socio ya se encontraba registrado (${porDni.nombre} ${porDni.apellido || ""}).`,
          });
        }
      }
    }

    if (!nuevoSocio) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo asignar un número de socio. Intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      socio: nuevoSocio,
      message: `¡Socio ${nuevoSocio.nombre} registrado con éxito con el número ${nuevoSocio.numeroSocio}!`,
    });
  } catch (error) {
    console.error("Error en alta rápida de socio:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar el nuevo socio." },
      { status: 500 }
    );
  }
}