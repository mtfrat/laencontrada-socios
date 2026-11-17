import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/guards";
import { dniSchema, readJsonBody, validate } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffSession();
    if (!auth.ok) return auth.response;

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        dni: dniSchema,
        nombre: z
          .string({ error: "El nombre del socio es obligatorio." })
          .trim()
          .min(1, "El nombre del socio es obligatorio."),
        apellido: z.string().trim().optional(),
        telefono: z.string().trim().optional(),
        email: z.string().trim().optional(),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { dni: cleanDni, nombre, apellido, telefono, email } = campos.data;

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
            apellido: apellido || null,
            telefono: telefono || null,
            email: email ? email.toLowerCase() : null,
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