"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Utensils, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function SocioLoginPage() {
  const [dni, setDni] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDni = dni.replace(/[.\-\s]/g, "").trim();
    if (!cleanDni) {
      setError("Por favor ingresa tu número de DNI.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/socio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: cleanDni }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No pudimos iniciar tu sesión.");
        setLoading(false);
        return;
      }

      router.push("/socio/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error de red. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf7f0] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <header className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-amber-900/70 hover:text-amber-900 font-medium py-1 px-2.5 rounded-lg bg-amber-100/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>
        <span className="text-xs font-serif font-bold text-amber-950">LA ENCONTRADA</span>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-200/60">
          {/* Logo & Heading */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-800 text-amber-50 flex items-center justify-center mx-auto shadow-md mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-amber-950">
              ¡Bienvenido, Socio!
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              Ingresá tu número de DNI para consultar tus puntos y premios disponibles.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="dni" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Número de DNI
              </label>
              <input
                id="dni"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 34123456"
                disabled={loading}
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-300 rounded-2xl text-lg font-mono text-stone-900 tracking-wider placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-amber-800 hover:bg-amber-900 disabled:bg-amber-700/60 text-white font-semibold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando socio...
                </>
              ) : (
                <>
                  Ingresar a mi cuenta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Test Hint */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              ¿Quieres probar el acceso? Usa el socio de prueba:
            </p>
            <button
              type="button"
              onClick={() => setDni("12345678")}
              className="mt-1.5 inline-block text-xs font-mono font-medium text-amber-800 hover:underline bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200"
            >
              DNI: 12345678
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-2 text-xs text-stone-400">
        ¿No tienes cuenta? Consulta con tu mozo en el salón para asociarte.
      </footer>
    </div>
  );
}
