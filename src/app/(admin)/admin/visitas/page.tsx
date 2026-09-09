import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header */}
      <header className="bg-[#0d0708]/90 backdrop-blur-md border-b border-[#5c131d]/40 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={session.role === "ADMIN" ? "/admin" : "/pos"}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition border border-stone-800"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="La Encontrada"
                width={30}
                height={30}
                className="drop-shadow-[0_1px_6px_rgba(92,19,29,0.5)]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Historial Gastronómico</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#e18693] border border-[#5c131d]/50 font-semibold">
                    Salón & Caja
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Usuario: {session.nombre}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-xs bg-stone-900 hover:bg-stone-800 text-[#ce7281] px-3 py-1.5 rounded-xl border border-[#5c131d]/40 transition flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}
            <Link
              href="/pos"
              className="text-xs bg-[#5c131d]/20 hover:bg-[#5c131d]/40 text-[#f5ede6] px-3 py-1.5 rounded-xl border border-[#5c131d]/40 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#ce7281]" />
              Terminal Salón
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
            <Utensils className="w-4 h-4 text-[#d4aa58]" />
            <span>Tiempo 2 • Enriquecimiento Posterior</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
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
