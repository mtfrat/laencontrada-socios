import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  codigoCanjeSchema,
  dniSchema,
  nombreSchema,
  passwordSchema,
  readJsonBody,
  usernameSchema,
  validate,
} from "@/lib/validation";

async function invalidResponse(result: Awaited<ReturnType<typeof readJsonBody>>) {
  if (result.ok) throw new Error("expected validation to fail");
  return {
    status: result.response.status,
    body: (await result.response.json()) as {
      success: boolean;
      code: string;
      error: string;
    },
  };
}

describe("readJsonBody", () => {
  it("cuerpo JSON inválido responde 400 INVALID_JSON con error legible", async () => {
    const result = await readJsonBody(
      new Request("http://test", { method: "POST", body: "not-json{" })
    );
    const { status, body } = await invalidResponse(result);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("INVALID_JSON");
    expect(typeof body.error).toBe("string");
  });

  it("cuerpo JSON válido devuelve los datos", async () => {
    const result = await readJsonBody(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ dni: "34123456" }),
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ dni: "34123456" });
  });
});

describe("validate — códigos", () => {
  const schema = z.object({ dni: dniSchema });

  it("campo ausente usa requiredCode cuando se provee", async () => {
    const result = validate(schema, {}, { requiredCode: "DNI_REQUIRED" });
    const { status, body } = await invalidResponse(result);

    expect(status).toBe(400);
    expect(body.code).toBe("DNI_REQUIRED");
  });

  it("campo presente pero inválido usa el code cuando se provee", async () => {
    const result = validate(schema, { dni: "123" }, {
      requiredCode: "DNI_REQUIRED",
      code: "DNI_INVALID",
    });
    const { body } = await invalidResponse(result);

    expect(body.code).toBe("DNI_INVALID");
    expect(typeof body.error).toBe("string");
  });

  it("usa VALIDATION_ERROR por defecto", async () => {
    const result = validate(schema, { dni: "123" });
    const { body } = await invalidResponse(result);

    expect(body.code).toBe("VALIDATION_ERROR");
  });
});

describe("dniSchema", () => {
  it("normaliza puntos, guiones y espacios", async () => {
    const result = validate(dniSchema, "34.123-456");
    expect(result.ok && result.data).toBe("34123456");
  });

  it("acepta de 6 a 20 dígitos", async () => {
    expect(validate(dniSchema, "123456").ok).toBe(true);
    expect(validate(dniSchema, "12345678901234567890").ok).toBe(true);
  });

  it("rechaza dígitos de menos de 6 o más de 20", async () => {
    expect(validate(dniSchema, "123").ok).toBe(false);
    expect(validate(dniSchema, "123456789012345678901").ok).toBe(false);
  });

  it("rechaza letras y caracteres no dígitos", async () => {
    expect(validate(dniSchema, "12ab34").ok).toBe(false);
    expect(validate(dniSchema, "").ok).toBe(false);
  });

  it("rechaza valores no string", async () => {
    expect(validate(dniSchema, 123456).ok).toBe(false);
    expect(validate(dniSchema, undefined).ok).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("convierte a minúsculas y acepta el formato válido", async () => {
    const result = validate(usernameSchema, "Admin_01");
    expect(result.ok && result.data).toBe("admin_01");
  });

  it("rechaza cortos, con espacios y caracteres inválidos", async () => {
    expect(validate(usernameSchema, "ab").ok).toBe(false);
    expect(validate(usernameSchema, "con espacios").ok).toBe(false);
    expect(validate(usernameSchema, "ñabc").ok).toBe(false);
  });
});

describe("passwordSchema / nombreSchema", () => {
  it("respeta el mínimo de longitud con el mensaje provisto", async () => {
    const result = validate(passwordSchema(4, "Mensaje corto"), "abc");
    const { body } = await invalidResponse(result);

    expect(body.error).toBe("Mensaje corto");
    expect(validate(passwordSchema(4, "Mensaje corto"), "abcd").ok).toBe(true);
  });

  it("aplica trim antes del mínimo", async () => {
    expect(validate(nombreSchema(3, "Requerido"), " Ana ").ok).toBe(true);
    expect(validate(nombreSchema(3, "Requerido"), "  A ").ok).toBe(false);
  });
});

describe("codigoCanjeSchema", () => {
  it("recorta espacios y exige contenido no vacío", async () => {
    const result = validate(codigoCanjeSchema, "  ABC-123  ");
    expect(result.ok && result.data).toBe("ABC-123");

    expect(validate(codigoCanjeSchema, "   ").ok).toBe(false);
    expect(validate(codigoCanjeSchema, undefined).ok).toBe(false);
  });
});
