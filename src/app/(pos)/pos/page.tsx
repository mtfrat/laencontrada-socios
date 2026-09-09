import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import PosContainer from "@/components/pos/PosContainer";
import { Shield, Sparkles } from "lucide-react";

export default async function PosTerminalPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  // Obtener la regla activa de conversión
  const config = await prisma.configuracionPuntos.findFirst();
  const pesosPorPunto = Number(config?.pesosPorPunto || 1000);

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header with Official Logo */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="La Encontrada"
              width={34}
              height={34}
              className="drop-shadow-[0_1px_6px_rgba(92,19,29,0.5)]"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">Terminal de Salón</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#e18693] border border-[#5c131d]/50 font-semibold">
                  {session.role}
                </span>
              </div>
              <p className="text-xs text-stone-400">Operador: {session.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-xs bg-stone-900 hover:bg-stone-800 text-[#ce7281] border border-[#5c131d]/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome & Shift info */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5c131d] via-[#3a0b12] to-[#0d0406] p-5 sm:p-6 border border-[#5c131d]/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4aa58]" />
              <span>Turno Activo • Salón Bistró</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Operaciones de Salón
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
              Carga ágil de consumo en mesas y validación de cupones QR de beneficios.
            </p>
          </div>
          <div className="sm:text-right shrink-0 bg-black/40 px-4 py-2.5 rounded-2xl border border-[#5c131d]/40">
            <span className="text-[11px] text-stone-400">Regla activa:</span>
            <p className="text-sm font-mono font-bold text-[#d4aa58]">
              ${pesosPorPunto.toLocaleString("es-AR")} = 1 punto
            </p>
          </div>
        </div>

        {/* Contenedor Táctil: Carga de Mesa o Validador de Cupón */}
        <PosContainer pesosPorPunto={pesosPorPunto} />
      </main>
    </div>
  );
}
