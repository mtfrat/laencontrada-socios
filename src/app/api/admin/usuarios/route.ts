import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/guards";
import {
  nombreSchema,
  passwordSchema,
  readJsonBody,
  staffEmailSchema,
  usernameSchema,
  validate,
} from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireSuperAdminSession();
    if (!auth.ok) return auth.response;

    const usuarios = await prisma.usuario.findMany({
      orderBy: [{ activo: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            visitasRegistradas: true,
            canjesValidados: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error("Error al obtener usuarios del personal:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar la nómina de personal." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdminSession();
    if (!auth.ok) return auth.response;

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;

    const campos = validate(
      z.object({
        username: usernameSchema.optional(),
        email: staffEmailSchema,
        nombre: nombreSchema(
          2,
          "El nombre completo debe tener al menos 2 caracteres."
        ),
        role: z.literal("EQUIPO").optional(),
        password: passwordSchema(
          12,
          "La contraseña inicial debe tener al menos 12 caracteres."
        ),
      }),
      bodyParsed.data
    );
    if (!campos.ok) return campos.response;
    const { username, email, nombre, password } = campos.data;

    const baseUsername = email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 13);
    const cleanUsername = username || `${baseUsername.length >= 3 ? baseUsername : "staff"}_${crypto.randomUUID().slice(0, 6)}`;

    // Verificar si el username ya existe
    const existing = await prisma.usuario.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `El nombre de usuario "${cleanUsername}" ya está registrado.` },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.usuario.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Ese email ya está registrado." }, { status: 400 });
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        username: cleanUsername,
        email,
        nombre: nombre.trim(),
        role: "EQUIPO",
        passwordHash,
        activo: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            visitasRegistradas: true,
            canjesValidados: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      usuario: nuevoUsuario,
      message: `Colaborador ${nuevoUsuario.nombre} (${nuevoUsuario.username}) registrado exitosamente.`,
    });
  } catch (error) {
    console.error("Error al crear usuario de personal:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al registrar el usuario." },
      { status: 500 }
    );
  }
}
