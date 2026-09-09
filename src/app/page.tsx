import Link from "next/link";
import { Utensils, Award, Users, ShieldCheck, Sparkles, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header / Logo */}
      <header className="w-full flex flex-col items-center text-center pt-8 pb-6 border-b border-amber-200/60">
        <div className="w-16 h-16 rounded-full bg-amber-800 text-amber-50 flex items-center justify-center shadow-lg mb-3">
          <Utensils className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-950 tracking-tight">
          La Encontrada
        </h1>
        <p className="text-amber-800/80 font-medium text-sm sm:text-base mt-1">
          Club de Socios & Experiencias Gastronómicas
        </p>
      </header>

      {/* Main Portal Access Cards */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
        {/* Socio Mobile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">Portal de Socios</h2>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Consulta tus puntos acumulados, descubrí premios para canjear y revisá tu posición en el ranking de clientes frecuentes.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/socio/login"
              className="w-full block text-center py-3 px-4 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded-xl shadow transition"
            >
              Ingresar con mi DNI
            </Link>
          </div>
        </div>

        {/* Terminal Mozos POS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">Terminal de Mozos</h2>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Carga ágil de consumo en mesa, división automática entre comensales y validador de cupones QR de canje.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/pos"
              className="w-full block text-center py-3 px-4 bg-orange-700 hover:bg-orange-800 text-white font-medium rounded-xl shadow transition"
            >
              Acceso a Salón / Caja
            </Link>
          </div>
        </div>

        {/* Back Office Admin */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">Administración</h2>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Panel de control gerencial, catálogo de premios, reglas de puntos, enriquecimiento gastronómico e importación de bases de datos.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/admin"
              className="w-full block text-center py-3 px-4 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl shadow transition"
            >
              Panel Gerencial
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights & Docs banner */}
      <footer className="w-full mt-auto pt-6 pb-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span>Restaurante La Encontrada • Sistema de Fidelización v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-stone-400">|</span>
          <span className="font-mono text-amber-900">Sprint 1.1: Base & Setup</span>
        </div>
      </footer>
    </main>
  );
}
