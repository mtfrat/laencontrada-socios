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
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-md border border-[#d7c9bb] bg-[#fffaf3] px-2 text-xs font-medium text-[#54262d] transition hover:bg-[#e9dfd1] sm:px-3"
      title="Cerrar turno / sesión"
      aria-label="Cerrar turno"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">Cerrar turno</span>
    </button>
  );
}
