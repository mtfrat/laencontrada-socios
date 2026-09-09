import { NextResponse } from "next/server";
import { clearSocioSession } from "@/lib/auth";

export async function POST() {
  await clearSocioSession();
  return NextResponse.json({ success: true, message: "Sesión de socio cerrada." });
}
