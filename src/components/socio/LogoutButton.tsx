"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function SocioLogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/socio/logout", { method: "POST" });
      router.push("/socio/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-700 bg-white hover:bg-red-50 border border-stone-200 px-3 py-1.5 rounded-xl transition shadow-sm font-medium"
      title="Cerrar sesión"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>Salir</span>
    </button>
  );
}
