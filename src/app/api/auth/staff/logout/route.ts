import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/auth";

export async function POST() {
  await clearStaffSession();
  return NextResponse.json({ success: true, message: "Sesión de personal cerrada." });
}
