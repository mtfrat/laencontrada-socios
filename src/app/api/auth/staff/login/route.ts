import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createStaffSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Usuario y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Buscar usuario en base de datos
    const user = await prisma.usuario.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    if (!user.activo) {
      return NextResponse.json(
        { success: false, error: "Este usuario de personal está inactivo." },
        { status: 403 }
      );
    }

    // Comparar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    // Crear sesión de personal
    await createStaffSession({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      role: user.role,
    });

    const redirectUrl = user.role === "ADMIN" ? "/admin" : "/pos";

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        role: user.role,
      },
      redirectTo: redirectUrl,
    });
  } catch (error: any) {
    console.error("Error en staff login:", error);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta configurar DATABASE_URL en las Variables de Entorno de Vercel. Luego debes hacer Redeploy.",
        },
        { status: 500 }
      );
    }

    const rawMessage = error?.message || "";
    if (rawMessage.includes("PrismaClient") || rawMessage.includes("database") || rawMessage.includes("connect")) {
      return NextResponse.json(
        {
          success: false,
          error: "Error de conexión con la base de datos Supabase: " + rawMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Error al iniciar sesión. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
