import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import StaffHeader from "@/components/staff/StaffHeader";
import PremiosManager from "@/components/admin/PremiosManager";
import { Gift } from "lucide-react";

export default async function AdminPremiosPage() {
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
      <StaffHeader title="Premios" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} backHref="/admin" />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            <span>Fidelización y Beneficios</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Productos para canjear
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Agregá una imagen, descripción y puntos para cada producto que podrán canjear los socios.
          </p>
        </div>

        <PremiosManager />
      </main>
    </div>
  );
}
