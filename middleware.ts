import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SOCIO_COOKIE = "laencontrada_socio_token";
const STAFF_COOKIE = "laencontrada_staff_token";

const STAFF_PREFIXES = ["/admin", "/pos", "/api/admin", "/api/pos"];
const SOCIO_PREFIXES = ["/socio", "/api/socio"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function verifyType(token: string, secret: string, type: "STAFF" | "SOCIO"): boolean {
  try {
    const decoded = jwt.verify(token, secret) as { type?: string };
    return decoded.type === type;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    return NextResponse.json(
      { success: false, code: "CONFIG_ERROR", error: "Servicio no configurado." },
      { status: 500 }
    );
  }

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const needsStaff = STAFF_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  const needsSocio = !needsStaff && SOCIO_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

  if (!needsStaff && !needsSocio) {
    return NextResponse.next();
  }

  if (needsStaff) {
    const token = request.cookies.get(STAFF_COOKIE)?.value;
    if (!token || !verifyType(token, secret, "STAFF")) {
      if (isApi) {
        return NextResponse.json(
          { success: false, code: "UNAUTHORIZED", error: "No autorizado." },
          { status: 401 }
        );
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/staff/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SOCIO_COOKIE)?.value;
  if (!token || !verifyType(token, secret, "SOCIO")) {
    if (isApi) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", error: "No autorizado." },
        { status: 401 }
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/socio/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pos/:path*",
    "/socio/:path*",
    "/api/admin/:path*",
    "/api/pos/:path*",
    "/api/socio/:path*",
  ],
};
