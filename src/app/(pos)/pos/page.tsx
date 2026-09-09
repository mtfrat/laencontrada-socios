import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import TablePointsLoader from "@/components/pos/TablePointsLoader";
import PosContainer from "@/components/pos/PosContainer";
import { Users, Shield, Sparkles } from "lucide-react";

export default async function PosTerminalPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  // Obtener la regla activa de conversión
  const config = await prisma.configuracionPuntos.findFirst();
  const pesosPorPunto = Number(config?.pesosPorPunto || 1000);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">Terminal de Salón</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700">
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
                className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
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
        <div className="bg-gradient-to-r from-orange-950/40 via-stone-900 to-stone-900 p-5 sm:p-6 rounded-3xl border border-orange-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Turno Activo • Salón</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Operaciones de Salón
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              Carga ágil de consumo en mesas y validación de cupones QR de beneficios.
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-[11px] text-stone-400">Regla activa:</span>
            <p className="text-sm font-mono font-bold text-amber-400">
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
