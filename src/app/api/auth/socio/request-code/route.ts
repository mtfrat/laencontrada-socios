import { NextResponse } from "next/server";

/** Retained for older clients; member access now uses DNI in both credential fields. */
export async function POST() {
  return NextResponse.json({ success: false, code: "ACCESS_METHOD_CHANGED", error: "Ingresá con tu DNI como usuario y contraseña." }, { status: 410 });
}
