import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import StaffHeader from "@/components/staff/StaffHeader";
import StaffChat from "@/components/staff/StaffChat";

export default async function StaffChatPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");

  const home = session.role === "SUPER_ADMIN" ? "/admin" : "/pos";
  return (
    <main className="min-h-screen bg-[#010101] text-stone-100 pb-10">
      <StaffHeader title="Chat interno" name={session.nombre} role={session.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"} backHref={home} />
      <div className="max-w-3xl mx-auto space-y-5 px-4 pt-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Chat interno</h1>
          <p className="text-sm text-stone-400">Conversación privada del administrador y el equipo.</p>
        </div>
        <StaffChat usuarioId={session.id} />
      </div>
    </main>
  );
}
