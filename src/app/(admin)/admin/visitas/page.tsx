import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/auth";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import VisitasManager from "@/components/admin/VisitasManager";
import { Utensils, ArrowLeft, Shield, Users } from "lucide-react";

export default async function AdminVisitasPage() {
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={session.role === "ADMIN" ? "/admin" : "/pos"}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Historial Gastronómico</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Salón & Caja
                </span>
              </div>
              <p className="text-xs text-stone-400">Usuario: {session.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-xl border border-stone-700 transition flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}
            <Link
              href="/pos"
              className="text-xs bg-orange-950/60 hover:bg-orange-900/60 text-orange-400 px-3 py-1.5 rounded-xl border border-orange-800/50 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Terminal Mozos
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Utensils className="w-4 h-4" />
            <span>Tiempo 2 • Enriquecimiento Posterior</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Historial de Mesas & Platos Consumidos
          </h1>
          <p className="text-sm text-stone-400 mt-1 max-w-2xl">
            Acá podés revisar todas las visitas registradas por los mozos en salón, cargar a posteriori los platos consumidos y asociar el número de ticket o comprobante fiscal para auditoría.
          </p>
        </div>

        {/* Componente interactivo */}
        <VisitasManager />
      </main>
    </div>
  );
}
