import { createHmac, randomInt } from "node:crypto";

const ACCESS_WINDOW_MS = 15 * 60 * 1000;
export const ACCESS_CODE_LIFETIME_MS = 10 * 60 * 1000;
export const ACCESS_REQUEST_WINDOW_MS = ACCESS_WINDOW_MS;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET inválido");
  return value;
}

export function newAccessCode() {
  return String(randomInt(0, 100_000_000)).padStart(8, "0");
}

export function hashAccessCode(challengeId: string, code: string) {
  return createHmac("sha256", secret()).update(`socio-access:${challengeId}:${code}`).digest("hex");
}

export function hashAccessIp(ip: string) {
  return createHmac("sha256", secret()).update(`socio-access-ip:${ip}`).digest("hex");
}

export function accessCodeIsValid(code: unknown): code is string {
  return typeof code === "string" && /^\d{8}$/.test(code);
}
