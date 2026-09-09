"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#010101] text-stone-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <header className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white font-medium py-1.5 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#5c131d]/50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>
        <span className="text-xs font-serif tracking-widest text-[#ce7281] font-bold">WINE BISTRO</span>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-[#0d0708] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#5c131d]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#5c131d]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Heading */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative mb-3 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="La Encontrada Wine Bistro"
                width={100}
                height={100}
                priority
                className="drop-shadow-[0_4px_20px_rgba(92,19,29,0.4)]"
              />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              Club de Socios
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              Ingresá tu DNI para ver tus puntos y recompensas en La Encontrada.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <label htmlFor="dni" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
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
                className="w-full px-4 py-3.5 bg-[#050304] border border-stone-800 rounded-2xl text-xl font-mono text-white tracking-wider placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#5c131d] focus:border-[#5c131d] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-[#5c131d] hover:bg-[#7a1a27] disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
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
          <div className="mt-6 pt-5 border-t border-stone-800/80 text-center relative z-10">
            <p className="text-xs text-stone-500">
              ¿Deseas probar una cuenta demo?
            </p>
            <button
              type="button"
              onClick={() => setDni("12345678")}
              className="mt-2 inline-block text-xs font-mono font-medium text-[#f5ede6] hover:text-white bg-[#5c131d]/20 hover:bg-[#5c131d]/30 px-3 py-1.5 rounded-xl border border-[#5c131d]/40 transition"
            >
              DNI Demo: 12345678 (Juan Pérez)
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-2 text-xs text-stone-500">
        ¿Aún no eres socio? Podés asociarte en segundos con el mozo en tu mesa.
      </footer>
    </div>
  );
}
