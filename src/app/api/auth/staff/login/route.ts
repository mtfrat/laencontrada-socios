import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createStaffSession } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { hitPersistentRateLimit } from "@/lib/persistent-rate-limit";
import { readJsonBody } from "@/lib/validation";

const RATE_LIMIT_ERROR =
  "Demasiados intentos de ingreso. Esperá unos minutos y volvé a intentar.";
const INTERNAL_ERROR = "Error al iniciar sesión. Intenta nuevamente.";

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, code: "RATE_LIMITED", error: RATE_LIMIT_ERROR },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request: Request) {
  try {
    const ipDecision = await hitPersistentRateLimit("staff-ip", getClientIp(request), 10, 15 * 60 * 1000);
    if (!ipDecision.allowed) return rateLimitedResponse(ipDecision.retryAfterSeconds);

    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;
    const { username, password } = bodyParsed.data as {
      username?: unknown;
      password?: unknown;
    };

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_CREDENTIALS",
          error: "Usuario y contraseña son requeridos.",
        },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length > 254) {
      return NextResponse.json({ success: false, code: "INVALID_CREDENTIALS", error: "Credenciales inválidas." }, { status: 401 });
    }
    const accountDecision = await hitPersistentRateLimit("staff-account", cleanUsername, 20, 15 * 60 * 1000);
    if (!accountDecision.allowed) return rateLimitedResponse(accountDecision.retryAfterSeconds);

    const user = await prisma.usuario.findUnique({
      where: cleanUsername.includes("@") ? { email: cleanUsername } : { username: cleanUsername },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    if (!user.activo) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_DISABLED",
          error: "Este usuario de personal está inactivo.",
        },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      user.passwordHash
    );
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    await createStaffSession({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      role: user.role,
    });

    const redirectUrl = user.role === "SUPER_ADMIN" ? "/admin" : "/pos";

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
  } catch (error) {
    console.error("Error en staff login:", {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", error: INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
