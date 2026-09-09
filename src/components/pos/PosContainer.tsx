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
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0d0708] border border-[#5c131d]/40 rounded-2xl max-w-xl mx-auto shadow-xl">
        <button
          type="button"
          onClick={() => setActiveTab("mesa")}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === "mesa"
              ? "bg-[#5c131d] text-white shadow-md border border-[#7a1a27]"
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
              ? "bg-[#5c131d] text-white shadow-md border border-[#7a1a27]"
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