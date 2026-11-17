import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffHeader from "@/components/staff/StaffHeader";
import PosContainer from "@/components/pos/PosContainer";

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
      <StaffHeader title="Terminal de salón" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} actions={[{ href: "/staff/chat", label: "Chat interno", icon: "chat" }, ...(session.role === "SUPER_ADMIN" ? [{ href: "/admin", label: "Panel del administrador", icon: "panel" } as const] : [])]} />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <PosContainer pesosPorPunto={pesosPorPunto} />
      </main>
    </div>
  );
}
