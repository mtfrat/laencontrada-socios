import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import StaffHeader from "@/components/staff/StaffHeader";
import VisitasManager from "@/components/admin/VisitasManager";
import { Utensils } from "lucide-react";

export default async function AdminVisitasPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/pos");
  }

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 pb-16">
      {/* Header */}
      <StaffHeader title="Visitas" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} backHref="/admin" />

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
            Acá podés revisar todas las visitas registradas por el equipo en salón, cargar a posteriori los platos consumidos y asociar el número de ticket o comprobante fiscal para auditoría.
          </p>
        </div>

        {/* Componente interactivo */}
        <VisitasManager />
      </main>
    </div>
  );
}
