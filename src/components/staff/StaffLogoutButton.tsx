"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function StaffLogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/staff/logout", { method: "POST" });
      router.push("/staff/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-[#f5ede6]/70 hover:text-white bg-[#150c0e] hover:bg-[#3a0b12]/60 border border-[#5c131d]/30 px-3 py-1.5 rounded-xl transition shadow-sm font-medium"
      title="Cerrar turno / sesión"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5 text-[#5c131d]" />
      )}
      <span>Cerrar Turno</span>
    </button>
  );
}
