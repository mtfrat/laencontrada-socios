"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, AlertCircle, ArrowLeft, Loader2, Lock, User } from "lucide-react";

export default function StaffLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Completa ambos campos para continuar.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Credenciales inválidas.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/pos");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const fillQuickCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#010101] text-stone-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <header className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white font-medium py-1.5 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#5c131d]/50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a la portada
        </Link>
        <span className="text-xs font-mono text-[#ce7281] uppercase tracking-wider font-semibold">Acceso Salón & Caja</span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-[#0d0708] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#5c131d]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#5c131d]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6 relative z-10">
            <div className="relative mb-3 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="La Encontrada Wine Bistro"
                width={95}
                height={95}
                priority
                className="drop-shadow-[0_4px_20px_rgba(92,19,29,0.4)]"
              />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              Personal & Salón
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              Terminal para mozos, cajeros y gerencia de La Encontrada.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: admin o mozo1"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#050304] border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#5c131d] focus:border-[#5c131d] transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#050304] border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#5c131d] focus:border-[#5c131d] transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-[#5c131d] hover:bg-[#7a1a27] disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Iniciar Turno / Sesión
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Fillers for Demo */}
          <div className="mt-6 pt-5 border-t border-stone-800/80 text-center relative z-10">
            <p className="text-xs text-stone-400 mb-2">Accesos rápidos de prueba:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials("mozo1", "mozo123")}
                className="text-xs font-mono bg-[#050304] hover:bg-[#5c131d]/20 text-[#f5ede6] px-3 py-1.5 rounded-lg border border-stone-800 hover:border-[#5c131d]/40 transition"
              >
                Mozo (mozo1)
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin", "admin123")}
                className="text-xs font-mono bg-[#050304] hover:bg-[#5c131d]/20 text-amber-300 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-[#5c131d]/40 transition"
              >
                Admin (admin)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-2 text-xs text-stone-500">
        Terminal Operativa de Salón • La Encontrada Wine Bistro
      </footer>
    </div>
  );
}
