"use client";

import { useState } from "react";
import TablePointsLoader from "./TablePointsLoader";
import CanjeValidator from "./CanjeValidator";
import { Utensils, QrCode } from "lucide-react";

export default function PosContainer({ pesosPorPunto }: { pesosPorPunto: number }) {
  const [activeTab, setActiveTab] = useState<"mesa" | "canje">("mesa");

  return (
    <div className="space-y-6">
      {/* Selector de Modo Táctil para Tablet */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-stone-900 border border-stone-800 rounded-2xl max-w-xl mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("mesa")}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === "mesa"
              ? "bg-orange-600 text-white shadow-md"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Carga de Mesa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("canje")}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === "canje"
              ? "bg-amber-600 text-white shadow-md"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Validar Cupón QR</span>
        </button>
      </div>

      {/* Vista Activa */}
      {activeTab === "mesa" ? (
        <TablePointsLoader pesosPorPunto={pesosPorPunto} />
      ) : (
        <CanjeValidator />
      )}
    </div>
  );
}