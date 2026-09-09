/**
 * Motor de Cálculo y Asignación de Puntos - La Encontrada
 * Lógica directa y simple para mesas y comensales
 */

export interface TablePointsCalculationParams {
  /** Monto total facturado en el ticket de la mesa (ej: $100.000) */
  totalTicket: number;
  /** Cantidad total de personas sentadas a la mesa (ej: 4) */
  guestCount: number;
  /** Valor monetario para obtener 1 punto (ej: $1.000) */
  pesosPorPunto: number;
}

export interface TablePointsCalculationResult {
  /** Gasto promedio individual por persona: totalTicket / guestCount */
  gastoPromedioPorPersona: number;
  /** Puntos a acreditar a cada socio presente: floor(gastoPromedio / pesosPorPunto) */
  puntosPorSocio: number;
}

/**
 * Calcula el gasto promedio por comensal y los puntos correspondientes a cada socio.
 * Ejemplo: Mesa de 4 personas con $100.000 de ticket y $1.000 por punto:
 * Gasto por persona = $25.000
 * Puntos por socio = 25 puntos
 */
export function calculateTablePoints(
  params: TablePointsCalculationParams
): TablePointsCalculationResult {
  const { totalTicket, guestCount, pesosPorPunto } = params;

  if (totalTicket <= 0) {
    throw new Error("El monto total del ticket debe ser mayor a 0.");
  }

  if (guestCount < 1) {
    throw new Error("La cantidad de comensales debe ser al menos 1.");
  }

  if (pesosPorPunto <= 0) {
    throw new Error("El ratio de pesos por punto debe ser mayor a 0.");
  }

  // 1. Gasto promedio por persona
  const gastoPromedioPorPersona = Math.round((totalTicket / guestCount) * 100) / 100;

  // 2. Puntos a acreditar a cada socio de la mesa
  const puntosPorSocio = Math.floor(gastoPromedioPorPersona / pesosPorPunto);

  return {
    gastoPromedioPorPersona,
    puntosPorSocio,
  };
}

/**
 * Retorna los puntos a bonificar por una encuesta de satisfacción
 */
export function calculateSurveyBonus(puntosPorEncuesta: number): number {
  return Math.max(0, Math.floor(puntosPorEncuesta));
}

/**
 * Valida si un código alfanumérico de cupón QR cumple con el formato estándar
 */
export function isValidCouponCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return /^[A-Z0-9]{6,16}$/.test(code.trim().toUpperCase());
}
