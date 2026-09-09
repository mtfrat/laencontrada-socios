import Link from "next/link";
import Image from "next/image";
import { Award, Users, ShieldCheck, Sparkles, ArrowRight, Wine } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#010101] text-stone-100 flex flex-col justify-between p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header with Official Logo */}
      <header className="w-full flex flex-col items-center text-center pt-8 pb-8 border-b border-[#5c131d]/40">
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#5c131d]/30 rounded-full blur-2xl scale-110" />
          <Image
            src="/logo.png"
            alt="La Encontrada Wine Bistro"
            width={130}
            height={130}
            priority
            className="relative z-10 drop-shadow-[0_4px_24px_rgba(92,19,29,0.5)]"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
          La Encontrada
        </h1>
        <p className="text-xs sm:text-sm font-sans tracking-widest uppercase text-[#ce7281] font-semibold mt-1">
          WINE BISTRO • CLUB DE SOCIOS
        </p>
        <p className="text-stone-400 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Programa exclusivo de membresía, recompensas en mesa y seguimiento de experiencias gastronómicas.
        </p>
      </header>

      {/* Main Portal Access Cards */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 my-10">
        {/* Portal del Socio */}
        <div className="bg-[#0d0708] rounded-3xl p-6 border border-[#5c131d]/40 hover:border-[#5c131d] transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c131d]/10 rounded-full blur-2xl group-hover:bg-[#5c131d]/20 transition" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#5c131d]/20 text-[#e18693] border border-[#5c131d]/40 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#ce7281]">Membresía</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">Portal de Socios</h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Ingresá con tu DNI para ver tus puntos disponibles, catálogo de vinos y platos para canjear, y tu posición en el ranking.
            </p>
          </div>
          <div className="mt-6 relative z-10">
            <Link
              href="/socio/login"
              className="w-full py-3.5 px-4 bg-[#5c131d] hover:bg-[#7a1a27] text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Ingresar con mi DNI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Terminal Mozos POS */}
        <div className="bg-[#0d0708] rounded-3xl p-6 border border-stone-800 hover:border-[#5c131d]/60 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-200 border border-stone-800 flex items-center justify-center mb-4 group-hover:border-[#5c131d]/50 transition">
              <Users className="w-6 h-6 text-[#ce7281]" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">Salón & Tablet</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">Terminal de Mozos</h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Carga ágil de tickets y comensales por mesa, alta rápida de nuevos socios en 5 segundos y validación de cupones QR.
            </p>
          </div>
          <div className="mt-6 relative z-10">
            <Link
              href="/pos"
              className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 hover:border-[#5c131d]/60 font-bold rounded-2xl shadow transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Terminal de Salón</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Back Office Admin */}
        <div className="bg-[#0d0708] rounded-3xl p-6 border border-stone-800 hover:border-[#5c131d]/60 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-200 border border-stone-800 flex items-center justify-center mb-4 group-hover:border-[#5c131d]/50 transition">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">Gerencia</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">Administración</h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Tablero de control, padrón de 286 socios, exportación a Excel, configuración del ratio de puntos y gestión de catálogo.
            </p>
          </div>
          <div className="mt-6 relative z-10">
            <Link
              href="/admin"
              className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 hover:border-[#5c131d]/60 font-bold rounded-2xl shadow transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Panel Gerencial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full mt-auto pt-6 pb-4 border-t border-[#5c131d]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <Wine className="w-4 h-4 text-[#ce7281]" />
          <span>La Encontrada Wine Bistro • Sistema de Membresía & Fidelización</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-stone-400">Bahía Blanca, Argentina</span>
        </div>
      </footer>
    </main>
  );
}
