"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import styles from "@/components/socio/member.module.css";

export default function SocioLoginPage() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const cleanDni = dni.replace(/[.\-\s]/g, "").trim();
    const cleanPassword = password.replace(/[.\-\s]/g, "").trim();
    if (!/^\d{6,20}$/.test(cleanDni) || !/^\d{6,20}$/.test(cleanPassword)) {
      setError("Ingresá un DNI válido en ambos campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/socio/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dni: cleanDni, password: cleanPassword }) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "No pudimos iniciar tu sesión. Intentá nuevamente.");
        return;
      }
      router.push("/socio/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos conectar. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return <div className={styles.loginPage}>
    <div className={styles.loginPhoto}>
      <Image src="/restaurant/salon.jpg" alt="Salón de La Encontrada junto al jardín" fill sizes="(max-width: 640px) 100vw, 55vw" priority />
      <div className={styles.loginPhotoText}><h2>Tu lugar en la mesa.</h2><p>Una visita se disfruta en el momento. Los buenos encuentros también dejan algo para volver.</p></div>
    </div>
    <div className={styles.loginContent}>
      <header className={styles.loginTop}>
        <Link href="/" className={styles.brand} aria-label="La Encontrada, volver al inicio"><Image src="/logo.png" alt="" width={39} height={39} /><span><strong>La Encontrada</strong><small>Wine Bistro · El Bolsón</small></span></Link>
        <Link href="/" className={styles.loginBack}><ArrowLeft size={16} /> Inicio</Link>
      </header>
      <main className={styles.loginMain}>
        <h1>Club de socios.</h1>
        <p className={styles.loginIntro}>Ingresá con tu DNI como usuario y contraseña para consultar tus puntos, premios y visitas.</p>
        {error && <p id="socio-login-error" role="alert" className={styles.loginError}>{error}</p>}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <label htmlFor="dni">Número de DNI</label>
          <input id="dni" type="text" inputMode="numeric" required maxLength={30} autoComplete="username" aria-invalid={Boolean(error)} aria-describedby={error ? "socio-login-error dni-hint" : "dni-hint"} value={dni} onChange={(event) => setDni(event.target.value)} placeholder="Ej. 34.123.456" disabled={loading} />
          <p id="dni-hint" className={styles.loginHint}>Podés escribirlo con o sin puntos.</p>
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" inputMode="numeric" required minLength={6} maxLength={30} autoComplete="current-password" aria-invalid={Boolean(error)} aria-describedby={error ? "socio-login-error password-hint" : "password-hint"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu DNI" disabled={loading} />
          <p id="password-hint" className={styles.loginHint}>Tu contraseña es tu DNI.</p>
          <button className={styles.loginSubmit} type="submit" disabled={loading}>{loading ? <>Ingresando <Loader2 size={19} className="animate-spin" /></> : <>Ingresar al club <ArrowRight size={19} /></>}</button>
        </form>
      </main>
      <footer className={styles.loginFooter}>¿Todavía no sos socio? Podés asociarte con el equipo cuando vengas a La Encontrada.</footer>
    </div>
  </div>;
}
