import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStaffSession } from "@/lib/auth";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";
import UsuariosManager from "@/components/admin/UsuariosManager";
import { Users, ArrowLeft, Shield, UserCog } from "lucide-react";

export default async function AdminUsuariosPage() {
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
              href="/admin"
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition border border-stone-800"
              title="Volver al Panel"
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
                  <span className="text-sm font-bold text-white">Gestión de Personal</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#5c131d]/30 text-[#e18693] border border-[#5c131d]/50 font-semibold">
                    Gerencia
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Usuario: {session.nombre}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs bg-stone-900 hover:bg-stone-800 text-[#ce7281] px-3 py-1.5 rounded-xl border border-[#5c131d]/40 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Panel Admin
            </Link>
            <StaffLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[#ce7281] text-xs font-semibold uppercase tracking-wider mb-1">
            <UserCog className="w-4 h-4" />
            <span>Equipo & Mozos de Salón</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Nómina de Personal & Control de Accesos
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Da de alta mozos, cajeros y administradores, resetea contraseñas y gestiona permisos de acceso a la terminal del restaurante.
          </p>
        </div>

        <UsuariosManager />
      </main>
    </div>
  );
}
