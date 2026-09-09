import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

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

    // Calcular el siguiente número de socio disponible correlativo
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

    // Asegurar que no colisione
    while (allSocios.some((s) => s.numeroSocio === nextNumSocio)) {
      nextNum++;
      nextNumSocio = `SOC-${nextNum}`;
    }

    // Crear el nuevo socio
    const nuevoSocio = await prisma.socio.create({
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
    });

    return NextResponse.json({
      success: true,
      socio: {
        id: nuevoSocio.id,
        numeroSocio: nuevoSocio.numeroSocio,
        dni: nuevoSocio.dni,
        nombre: nuevoSocio.nombre,
        apellido: nuevoSocio.apellido,
        puntosActuales: nuevoSocio.puntosActuales,
      },
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