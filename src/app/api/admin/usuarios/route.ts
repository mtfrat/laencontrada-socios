import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { RolUsuario } from "@prisma/client";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const usuarios = await prisma.usuario.findMany({
      orderBy: [{ activo: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        username: true,
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
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { username, nombre, role, password } = body;

    // Validación de username
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, error: "El nombre de usuario es obligatorio." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          error: "El usuario debe tener entre 3 y 20 caracteres y solo contener letras, números o guiones bajos (sin espacios).",
        },
        { status: 400 }
      );
    }

    // Validación de nombre
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "El nombre completo debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    // Validación de rol
    const validRoles: RolUsuario[] = ["ADMIN", "MOZO", "CAJERO"];
    if (!role || !validRoles.includes(role as RolUsuario)) {
      return NextResponse.json(
        { success: false, error: "El rol seleccionado no es válido (ADMIN, MOZO o CAJERO)." },
        { status: 400 }
      );
    }

    // Validación de contraseña
    if (!password || typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { success: false, error: "La contraseña inicial debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

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

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        username: cleanUsername,
        nombre: nombre.trim(),
        role: role as RolUsuario,
        passwordHash,
        activo: true,
      },
      select: {
        id: true,
        username: true,
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
