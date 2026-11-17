import { z } from "zod";
import { NextResponse } from "next/server";

export type Validation<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

interface ValidationIssue {
  message?: string;
  path?: PropertyKey[];
}

function isMissingValue(data: unknown, path: PropertyKey[]): boolean {
  let current: unknown = data;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== "object") {
      return true;
    }
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current === undefined || current === null;
}

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  opts: { code?: string; requiredCode?: string } = {}
): Validation<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const issue = result.error.issues[0] as ValidationIssue | undefined;
  const missing = issue ? isMissingValue(data, issue.path ?? []) : data === undefined || data === null;
  const code =
    missing && opts.requiredCode
      ? opts.requiredCode
      : opts.code ?? "VALIDATION_ERROR";

  return {
    ok: false,
    response: NextResponse.json(
      {
        success: false,
        code,
        error: issue?.message || "Datos inválidos.",
      },
      { status: 400 }
    ),
  };
}

export async function readJsonBody(
  request: Request
): Promise<Validation<unknown>> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "INVALID_JSON",
          error: "El cuerpo de la petición no es JSON válido.",
        },
        { status: 400 }
      ),
    };
  }
}

export function normalizeDni(value: string): string {
  return value.replace(/[.\-\s]/g, "");
}

export const dniSchema = z
  .string({ error: "El número de DNI es obligatorio." })
  .trim()
  .transform(normalizeDni)
  .pipe(
    z.string().regex(/^\d{6,20}$/, "El DNI ingresado no es válido.")
  );

export const nombreSchema = (min: number, message: string) =>
  z
    .string({ error: message })
    .trim()
    .min(min, message);

export const usernameSchema = z
  .string({ error: "El nombre de usuario es obligatorio." })
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9_]{3,20}$/,
        "El usuario debe tener entre 3 y 20 caracteres y solo contener letras, números o guiones bajos (sin espacios)."
      )
  );

export const staffEmailSchema = z.string({ error: "El email es obligatorio." })
  .trim()
  .toLowerCase()
  .email("Ingresá un email válido.");

export const passwordSchema = (min: number, message: string) =>
  z
    .string({ error: message })
    .min(min, message);

export const codigoCanjeSchema = z
  .string({ error: "Ingresa el código del cupón o escanea el código QR." })
  .trim()
  .min(1, "Ingresa el código del cupón o escanea el código QR.");
