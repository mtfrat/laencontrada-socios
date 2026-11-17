import { afterEach, describe, expect, it, vi } from "vitest";
import { isMailDeliveryConfigured, sendSocioAccessCode } from "@/lib/mail";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("correo de ingreso de socios", () => {
  it("falla cerrado en producción sin proveedor", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOCAL_REVIEW", "true");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    expect(isMailDeliveryConfigured()).toBe(false);
    await expect(sendSocioAccessCode("socio@example.test", "12345678", "challenge-1")).rejects.toThrow("MAIL_NOT_CONFIGURED");
  });

  it("envía mediante Resend con clave idempotente y código de 10 minutos", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test_secret");
    vi.stubEnv("RESEND_FROM_EMAIL", "La Encontrada <acceso@example.test>");
    const send = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", send);
    await sendSocioAccessCode("socio@example.test", "12345678", "challenge-1");
    expect(send).toHaveBeenCalledTimes(1);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers["Idempotency-Key"]).toBe("socio-login/challenge-1");
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({ to: ["socio@example.test"], from: "La Encontrada <acceso@example.test>" });
    expect(body.text).toContain("12345678");
    expect(body.text).toContain("10 minutos");
  });

  it("propaga el rechazo del proveedor para invalidar el código", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test_secret");
    vi.stubEnv("RESEND_FROM_EMAIL", "acceso@example.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(sendSocioAccessCode("socio@example.test", "12345678", "challenge-1")).rejects.toThrow("MAIL_SEND_FAILED_403");
  });
});
