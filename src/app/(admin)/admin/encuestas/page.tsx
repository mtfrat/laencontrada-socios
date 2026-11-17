import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import StaffHeader from "@/components/staff/StaffHeader";
import EncuestasManager from "@/components/admin/EncuestasManager";
import { HelpCircle } from "lucide-react";

export default async function AdminEncuestasPage() {
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
      <StaffHeader title="Encuestas" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} backHref="/admin" />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Calidad y Experiencia del Cliente</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Encuesta de Satisfacción 100% Editable
          </h1>
          <p className="text-sm text-stone-400 mt-1 max-w-2xl">
            Edita las preguntas que los socios responderán desde su celular después de comer, agrega nuevas preguntas o desactiva las que no necesites, y define los puntos de bonificación.
          </p>
        </div>

        <EncuestasManager />
      </main>
    </div>
  );
}
