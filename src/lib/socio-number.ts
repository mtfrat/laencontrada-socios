export function normalizeSocioNumber(value: string): string {
  const clean = value.trim().replace(/\s+/g, "").toUpperCase();
  return /^\d+$/.test(clean) ? `SOC-${clean}` : clean;
}
