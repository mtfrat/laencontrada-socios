export function isMailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()) ||
    (process.env.NODE_ENV !== "production" && process.env.LOCAL_REVIEW === "true");
}

export async function sendSocioAccessCode(email: string, code: string, challengeId: string) {
  if (!isMailDeliveryConfigured()) throw new Error("MAIL_NOT_CONFIGURED");
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (apiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `socio-login/${challengeId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Tu código de acceso · La Encontrada",
        text: `Tu código para ingresar al Club de La Encontrada es ${code}. Vence en 10 minutos. Si no lo solicitaste, ignorá este mensaje.`,
        html: `<div style="background:#f5f0e7;padding:32px;font-family:Arial,sans-serif;color:#352b2b"><div style="max-width:480px;margin:auto;background:#fffaf3;padding:32px;border:1px solid #d7c9bb"><p style="font-size:12px;letter-spacing:.14em;color:#71343d">LA ENCONTRADA · CLUB DE SOCIOS</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:34px">Tu código de acceso</h1><p>Usá este código para ingresar a tu cuenta:</p><p style="font-size:34px;font-weight:700;letter-spacing:.18em;color:#54262d">${code}</p><p>Vence en 10 minutos. Si no lo solicitaste, ignorá este mensaje.</p></div></div>`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`MAIL_SEND_FAILED_${response.status}`);
    return;
  }
  // Buzón de pruebas local: nunca se habilita en producción.
  console.info(`[LOCAL_REVIEW] Código de acceso para ${email}: ${code}`);
}
