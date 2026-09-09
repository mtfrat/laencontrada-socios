"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  Utensils,
  Award,
  Sparkles,
  ArrowUpRight,
  Gift,
  Clock,
  CheckCircle2,
  Calendar,
  Percent,
  Coins,
  ChevronRight,
  BarChart3,
  Flame,
} from "lucide-react";

export interface MetricsData {
  financials: {
    totalFacturado: number;
    ticketPromedio: number;
    gastoPromedioComensal: number;
    totalComensales: number;
    totalVisitas: number;
  };
  pointsBalance: {
    puntosCirculacion: number;
    puntosEmitidos: number;
    puntosCanjeados: number;
    tasaCanje: number;
    pesosPorPunto: number;
  };
  shiftsBreakdown: Array<{
    turno: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  topPremios: Array<{
    id: string;
    titulo: string;
    puntosRequeridos: number;
    totalCanjes: number;
    stock: number;
  }>;
  topSocios: Array<{
    id: string;
    nombre: string;
    numeroSocio: string;
    puntosActuales: number;
    totalVisitas: number;
  }>;
  recentActivity: Array<{
    id: string;
    tipo: "VISITA" | "CANJE";
    socioNombre: string;
    detalle: string;
    puntos: number;
    fecha: string;
  }>;
}

export default function AdminMetricsDashboard({ data }: { data: MetricsData }) {
  const [activeTab, setActiveTab] = useState<"general" | "fidelizacion" | "habitos">("general");

  const { financials, pointsBalance, shiftsBreakdown, topPremios, topSocios, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas de Métricas */}
      <div className="flex items-center gap-2 border-b border-[#5c131d]/25 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "general"
              ? "bg-[#5c131d] text-white shadow-lg shadow-[#5c131d]/30"
              : "bg-[#0d0708] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/20"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Finanzas & Salón</span>
        </button>

        <button
          onClick={() => setActiveTab("fidelizacion")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "fidelizacion"
              ? "bg-[#5c131d] text-white shadow-lg shadow-[#5c131d]/30"
              : "bg-[#0d0708] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/20"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Motor de Puntos</span>
        </button>

        <button
          onClick={() => setActiveTab("habitos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "habitos"
              ? "bg-[#5c131d] text-white shadow-lg shadow-[#5c131d]/30"
              : "bg-[#0d0708] text-[#f5ede6]/60 hover:text-white border border-[#5c131d]/20"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Premios & Turnos</span>
        </button>
      </div>

      {/* PESTAÑA 1: FINANZAS Y SALÓN */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Fila 1: 4 KPIs Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Facturación Registrada */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between group hover:border-[#5c131d]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                  Facturación en Mesas
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#d4aa58] border border-[#5c131d]/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl lg:text-3xl font-bold font-mono text-[#d4aa58]">
                  ${financials.totalFacturado.toLocaleString("es-AR")}
                </p>
                <p className="text-[11px] text-[#f5ede6]/40 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En {financials.totalVisitas} visitas de socios</span>
                </p>
              </div>
            </div>

            {/* Ticket Promedio por Mesa */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between group hover:border-[#5c131d]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                  Ticket Promedio / Mesa
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl lg:text-3xl font-bold font-mono text-white">
                  ${financials.ticketPromedio.toLocaleString("es-AR")}
                </p>
                <p className="text-[11px] text-[#f5ede6]/40 mt-1">
                  Consumo promedio por comanda
                </p>
              </div>
            </div>

            {/* Gasto Promedio por Comensal */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between group hover:border-[#5c131d]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                  Gasto Promedio Per Cápita
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#d4aa58]/15 text-[#d4aa58] border border-[#d4aa58]/30 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl lg:text-3xl font-bold font-mono text-[#d4aa58]">
                  ${financials.gastoPromedioComensal.toLocaleString("es-AR")}
                </p>
                <p className="text-[11px] text-[#f5ede6]/40 mt-1">
                  Gasto individual por persona
                </p>
              </div>
            </div>

            {/* Comensales Atendidos */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between group hover:border-[#5c131d]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                  Comensales Fidelizados
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#e18693] border border-[#5c131d]/40 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl lg:text-3xl font-bold font-mono text-white">
                  {financials.totalComensales.toLocaleString("es-AR")}
                </p>
                <p className="text-[11px] text-[#f5ede6]/40 mt-1">
                  Personas en mesas registradas
                </p>
              </div>
            </div>
          </div>

          {/* Fila 2: Podio de Socios & Feed Reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Socios con Mayor Fidelidad */}
            <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#d4aa58]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                    Top Socios con Mayor Fidelidad
                  </h3>
                </div>
                <Link
                  href="/admin/socios"
                  className="text-xs text-[#ce7281] hover:text-white flex items-center gap-1 transition"
                >
                  <span>Ver padrón</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {topSocios.length === 0 ? (
                <p className="text-xs text-[#f5ede6]/40 py-6 text-center">
                  No hay socios con consumos registrados aún.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topSocios.map((s, idx) => (
                    <div
                      key={s.id}
                      className="bg-[#050304] border border-[#5c131d]/20 rounded-2xl p-3 flex items-center justify-between hover:border-[#5c131d]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            idx === 0
                              ? "bg-[#d4aa58] text-[#010101]"
                              : idx === 1
                              ? "bg-stone-300 text-[#010101]"
                              : idx === 2
                              ? "bg-[#ce7281] text-white"
                              : "bg-[#150c0e] text-[#f5ede6]/60 border border-[#5c131d]/20"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{s.nombre}</p>
                          <p className="text-[10px] font-mono text-[#f5ede6]/40">
                            {s.numeroSocio} • {s.totalVisitas} visitas al salón
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-[#d4aa58]">
                          {s.puntosActuales.toLocaleString("es-AR")} pts
                        </p>
                        <span className="text-[10px] text-emerald-400 font-medium">Activo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actividad Reciente en Salón */}
            <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#ce7281]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                    Actividad Reciente en Salón
                  </h3>
                </div>
                <Link
                  href="/admin/visitas"
                  className="text-xs text-[#ce7281] hover:text-white flex items-center gap-1 transition"
                >
                  <span>Historial completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-xs text-[#f5ede6]/40 py-6 text-center">
                  Sin actividad reciente registrada.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="bg-[#050304] border border-[#5c131d]/20 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            act.tipo === "VISITA"
                              ? "bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30"
                              : "bg-[#d4aa58]/15 text-[#d4aa58] border border-[#d4aa58]/30"
                          }`}
                        >
                          {act.tipo === "VISITA" ? <Utensils className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {act.socioNombre}
                          </p>
                          <p className="text-[10px] text-[#f5ede6]/50">
                            {act.detalle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold ${
                            act.tipo === "VISITA" ? "text-emerald-400" : "text-[#d4aa58]"
                          }`}
                        >
                          {act.tipo === "VISITA" ? `+${act.puntos}` : `-${act.puntos}`} pts
                        </span>
                        <p className="text-[10px] text-[#f5ede6]/30 font-mono">
                          {act.fecha}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: MOTOR DE PUNTOS */}
      {activeTab === "fidelizacion" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Tarjetas de Balance de Puntos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Puntos en Circulación (Pasivo comercial) */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                    Puntos en Circulación
                  </span>
                  <Coins className="w-5 h-5 text-[#d4aa58]" />
                </div>
                <p className="text-3xl font-extrabold font-mono text-[#d4aa58]">
                  {pointsBalance.puntosCirculacion.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-[#f5ede6]/40 mt-1">
                  Saldo activo en billeteras de socios pendiente de canje.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#5c131d]/20 text-[11px] text-[#f5ede6]/60">
                Pasivo estimado: <strong className="font-mono text-white">${(pointsBalance.puntosCirculacion * pointsBalance.pesosPorPunto).toLocaleString("es-AR")}</strong> en consumo equivalente
              </div>
            </div>

            {/* Puntos Emitidos Totales */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                    Puntos Emitidos Totales
                  </span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-extrabold font-mono text-white">
                  {pointsBalance.puntosEmitidos.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-[#f5ede6]/40 mt-1">
                  Puntos generados históricamente por consumos en mesa y encuestas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#5c131d]/20 text-[11px] text-[#f5ede6]/60">
                Ratio de acumulación: <strong className="font-mono text-white">${pointsBalance.pesosPorPunto.toLocaleString("es-AR")} = 1 pt</strong>
              </div>
            </div>

            {/* Puntos Canjeados / Burn Rate */}
            <div className="bg-[#0d0708] border border-[#5c131d]/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#f5ede6]/50 font-semibold">
                    Tasa de Redención
                  </span>
                  <Gift className="w-5 h-5 text-[#ce7281]" />
                </div>
                <p className="text-3xl font-extrabold font-mono text-[#ce7281]">
                  {pointsBalance.tasaCanje}%
                </p>
                <p className="text-xs text-[#f5ede6]/40 mt-1">
                  {pointsBalance.puntosCanjeados.toLocaleString("es-AR")} puntos canjeados por premios entregados.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#5c131d]/20 text-[11px] text-[#f5ede6]/60">
                Salud del programa: <span className="text-emerald-400 font-semibold">Actividad Óptima</span>
              </div>
            </div>
          </div>

          {/* Barra de Distribución Visual de Puntos */}
          <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
              Balance General del Ecosistema de Fidelización
            </h3>
            
            <div>
              <div className="flex justify-between text-xs text-[#f5ede6]/60 mb-2">
                <span>En Circulación: <strong className="text-[#d4aa58] font-mono">{pointsBalance.puntosCirculacion.toLocaleString("es-AR")} pts</strong></span>
                <span>Canjeados: <strong className="text-[#ce7281] font-mono">{pointsBalance.puntosCanjeados.toLocaleString("es-AR")} pts</strong></span>
              </div>

              <div className="w-full h-3.5 bg-[#050304] rounded-full overflow-hidden flex border border-[#5c131d]/30">
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.min(
                        95,
                        (pointsBalance.puntosCirculacion / (pointsBalance.puntosEmitidos || 1)) * 100
                      )
                    )}%`,
                  }}
                  className="bg-gradient-to-r from-[#d4aa58] to-[#b38a3c] h-full"
                  title="Puntos en Circulación"
                />
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.min(
                        95,
                        (pointsBalance.puntosCanjeados / (pointsBalance.puntosEmitidos || 1)) * 100
                      )
                    )}%`,
                  }}
                  className="bg-[#5c131d] h-full"
                  title="Puntos Canjeados"
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#f5ede6]/40 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#d4aa58]" /> Billeteras Activas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5c131d]" /> Premios Retirados
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PREMIOS Y TURNOS */}
      {activeTab === "habitos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Premios Más Populares */}
          <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ce7281]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                  Premios Más Canjeados
                </h3>
              </div>
              <Link
                href="/admin/premios"
                className="text-xs text-[#ce7281] hover:text-white flex items-center gap-1 transition"
              >
                <span>Catálogo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topPremios.length === 0 ? (
              <p className="text-xs text-[#f5ede6]/40 py-8 text-center">
                Aún no hay canjes registrados en el catálogo.
              </p>
            ) : (
              <div className="space-y-3">
                {topPremios.map((p, idx) => {
                  const maxCanjes = Math.max(...topPremios.map((x) => x.totalCanjes), 1);
                  const pct = Math.round((p.totalCanjes / maxCanjes) * 100);

                  return (
                    <div key={p.id} className="space-y-1.5 bg-[#050304] p-3 rounded-2xl border border-[#5c131d]/20">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#d4aa58] font-bold">#{idx + 1}</span>
                          <span className="font-semibold text-white">{p.titulo}</span>
                        </div>
                        <span className="font-mono font-bold text-[#ce7281]">
                          {p.totalCanjes} canjes
                        </span>
                      </div>

                      <div className="w-full h-2 bg-[#150c0e] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(8, pct)}%` }}
                          className="bg-gradient-to-r from-[#5c131d] to-[#ce7281] h-full rounded-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#f5ede6]/40">
                        <span>Costo: <strong className="font-mono text-[#d4aa58]">{p.puntosRequeridos} pts</strong></span>
                        <span>Stock: {p.stock === -1 ? "Ilimitado" : `${p.stock} disponibles`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribución por Turnos Horarios */}
          <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#d4aa58]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                  Distribución de Turnos de Consumo
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {shiftsBreakdown.map((s) => (
                <div key={s.turno} className="space-y-1.5 bg-[#050304] p-3.5 rounded-2xl border border-[#5c131d]/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase tracking-wider">
                      {s.label}
                    </span>
                    <span className="font-mono font-bold text-[#d4aa58]">
                      {s.count} visitas ({s.percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-[#150c0e] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, s.percentage)}%` }}
                      className="bg-gradient-to-r from-[#5c131d] via-[#a82435] to-[#d4aa58] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#150c0e] rounded-2xl border border-[#5c131d]/20 text-xs text-[#f5ede6]/60 flex items-center gap-2 mt-4">
              <Calendar className="w-4 h-4 text-[#ce7281] shrink-0" />
              <span>
                Los mozos registran automáticamente la franja horaria de cada mesa desde la terminal de salón.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
