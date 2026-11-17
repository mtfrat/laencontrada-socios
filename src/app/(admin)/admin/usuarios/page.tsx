import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import StaffHeader from "@/components/staff/StaffHeader";
import UsuariosManager from "@/components/admin/UsuariosManager";
import { UserCog } from "lucide-react";

export default async function AdminUsuariosPage() {
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
      <StaffHeader title="Equipo" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} backHref="/admin" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
            <UserCog className="w-4 h-4" />
            <span>Equipo del restaurante</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Equipo y control de accesos
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Creá cuentas del equipo con email y contraseña. El administrador gestiona sus accesos.
          </p>
        </div>

        <UsuariosManager />
      </main>
    </div>
  );
}
