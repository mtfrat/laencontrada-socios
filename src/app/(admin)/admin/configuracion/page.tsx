import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/auth";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import ConfiguracionManager from "@/components/admin/ConfiguracionManager";
import { Settings, ArrowLeft, Shield } from "lucide-react";

export default async function AdminConfiguracionPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/pos");
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Reglas del Restaurante</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Gerencia
                </span>
              </div>
              <p className="text-xs text-stone-400">Usuario: {session.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-xl border border-stone-700 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Panel Admin
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Parámetros Comerciales del Negocio</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Reglas del Motor de Puntos
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Ajusta los ratios de conversión de dinero a puntos, tiempos de expiración de cupones QR y bonos de satisfacción en tiempo real.
          </p>
        </div>

        <ConfiguracionManager />
      </main>
    </div>
  );
}