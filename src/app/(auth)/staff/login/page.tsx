"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertCircle, ArrowLeft, Loader2, Lock, User } from "lucide-react";

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
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <header className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 font-medium py-1 px-2.5 rounded-lg bg-stone-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a la portada
        </Link>
        <span className="text-xs font-mono text-amber-500 uppercase">Acceso Interno</span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-stone-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-100">
              Personal & Administración
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              Ingresá con tu usuario para operar la terminal de mozos o el panel de control.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: admin o mozo1"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-stone-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
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
          <div className="mt-6 pt-5 border-t border-stone-700/60 text-center">
            <p className="text-xs text-stone-400 mb-2">Accesos rápidos de prueba:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials("mozo1", "mozo123")}
                className="text-xs font-mono bg-stone-900 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg border border-stone-700 transition"
              >
                Mozo (mozo1)
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin", "admin123")}
                className="text-xs font-mono bg-stone-900 hover:bg-stone-700 text-amber-400 px-3 py-1.5 rounded-lg border border-stone-700 transition"
              >
                Admin (admin)
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-md mx-auto text-center py-2 text-xs text-stone-500">
        Sistema La Encontrada • Terminal de Mozos y Back Office v1.0
      </footer>
    </div>
  );
}
