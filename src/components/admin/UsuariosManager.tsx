"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Plus, Shield, Users } from "lucide-react";

type Cuenta = {
  id: string;
  nombre: string;
  email: string | null;
  username: string;
  role: string;
  activo: boolean;
  createdAt: string;
};

export default function UsuariosManager() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState<Cuenta | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const editRef = useRef<HTMLElement>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/admin/usuarios", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo cargar el equipo.");
      setCuentas(result.usuarios);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // La consulta actualiza el estado después de recibir la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);
  useEffect(() => { if (editing) editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [editing]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("new"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, role: "EQUIPO" }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo crear la cuenta.");
      setNombre(""); setEmail(""); setPassword("");
      setNotice(`Cuenta de equipo creada para ${result.usuario.nombre}.`);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta.");
    } finally { setBusy(""); }
  }

  function openEdit(cuenta: Cuenta) {
    setEditing(cuenta); setEditNombre(cuenta.nombre); setEditEmail(cuenta.email || "");
    setEditUsername(cuenta.username); setNewPassword(""); setError(""); setNotice("");
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(editing.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/usuarios/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "editar_perfil", nombre: editNombre, email: editEmail, username: editUsername }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo actualizar la cuenta.");
      setEditing(null); setNotice("Cuenta actualizada."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar la cuenta."); }
    finally { setBusy(""); }
  }

  async function updatePassword() {
    if (!editing || newPassword.length < 12) { setError("La contraseña debe tener al menos 12 caracteres."); return; }
    setBusy(editing.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/usuarios/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cambiar_password", password: newPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo cambiar la contraseña.");
      setNewPassword(""); setNotice("Contraseña actualizada.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cambiar la contraseña."); }
    finally { setBusy(""); }
  }

  async function toggle(cuenta: Cuenta) {
    setBusy(cuenta.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/usuarios/${cuenta.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_activo", activo: !cuenta.activo }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo cambiar el acceso.");
      setNotice(cuenta.activo ? "Acceso pausado." : "Acceso activado."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cambiar el acceso."); }
    finally { setBusy(""); }
  }

  const field = "w-full rounded-xl border border-stone-700 bg-[#090607] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d4aa58]";
  const button = "rounded-xl bg-[#5c131d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#77202d] disabled:opacity-50";

  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200"><CheckCircle2 size={17}/>{notice}</p>}
    <section className="rounded-3xl border border-[#5c131d]/40 bg-[#0d0708] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3"><Plus className="text-[#d4aa58]"/><div><h2 className="text-lg font-semibold text-white">Agregar al equipo</h2><p className="text-xs text-stone-400">Esta cuenta tendrá acceso a la terminal y al chat interno.</p></div></div>
      <form onSubmit={createAccount} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-stone-300">Nombre completo<input className={`${field} mt-1`} required minLength={2} value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="name" /></label>
        <label className="text-xs text-stone-300">Email de acceso<input className={`${field} mt-1`} required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="text-xs text-stone-300 sm:col-span-2">Contraseña inicial<input className={`${field} mt-1`} required minLength={12} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 12 caracteres" /></label>
        <div className="sm:col-span-2 flex justify-end"><button className={button} type="submit" disabled={busy === "new"}>{busy === "new" ? "Creando..." : "Crear cuenta de equipo"}</button></div>
      </form>
    </section>
    <section className="rounded-3xl border border-[#5c131d]/40 bg-[#0d0708] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3"><Users className="text-[#d4aa58]"/><div><h2 className="text-lg font-semibold">Cuentas del restaurante</h2><p className="text-xs text-stone-400">Administrador y equipo</p></div></div>
      {loading ? <p className="flex items-center gap-2 text-sm text-stone-400"><Loader2 className="animate-spin" size={17}/> Cargando...</p> : <div className="space-y-3">{cuentas.map(cuenta => <div key={cuenta.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-[#090607] p-4">
        <div><div className="flex items-center gap-2"><strong className="text-sm text-white">{cuenta.nombre}</strong><span className="rounded-full border border-stone-700 px-2 py-0.5 text-[10px] uppercase text-[#d4aa58]">{cuenta.role === "SUPER_ADMIN" ? "Administrador" : "Equipo"}</span></div><p className="text-xs text-stone-400">{cuenta.email || `Usuario: ${cuenta.username}`}</p><p className="text-[11px] text-stone-500">{cuenta.activo ? "Acceso activo" : "Acceso pausado"}</p></div>
        <div className="flex gap-2"><button className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-stone-200 hover:border-[#d4aa58]" onClick={() => openEdit(cuenta)}>Editar</button>{cuenta.role !== "SUPER_ADMIN" && <button className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-stone-200 hover:border-[#d4aa58] disabled:opacity-50" disabled={busy === cuenta.id} onClick={() => toggle(cuenta)}>{cuenta.activo ? "Pausar" : "Activar"}</button>}</div>
      </div>)}</div>}
    </section>
    {editing && <section ref={editRef} className="scroll-mt-24 rounded-3xl border border-[#5c131d]/40 bg-[#0d0708] p-5 sm:p-6" aria-label="Editar cuenta"><div className="mb-4 flex items-center gap-2"><Shield className="text-[#d4aa58]"/><h2 className="text-lg font-semibold">Editar {editing.nombre}</h2></div><form onSubmit={updateAccount} className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-stone-300">Nombre<input className={`${field} mt-1`} required value={editNombre} onChange={e => setEditNombre(e.target.value)}/></label><label className="text-xs text-stone-300">Email<input className={`${field} mt-1`} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}/></label><label className="text-xs text-stone-300 sm:col-span-2">Usuario alternativo<input className={`${field} mt-1`} required value={editUsername} onChange={e => setEditUsername(e.target.value)}/></label><div className="sm:col-span-2 flex justify-end gap-2"><button className="rounded-xl border border-stone-700 px-4 py-2 text-sm" type="button" onClick={() => setEditing(null)}>Cerrar</button><button className={button} disabled={busy === editing.id}>Guardar cambios</button></div></form><div className="mt-5 border-t border-stone-800 pt-5"><label className="text-xs text-stone-300">Nueva contraseña<input className={`${field} mt-1`} type="password" minLength={12} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 12 caracteres"/></label><button type="button" className={`${button} mt-3`} onClick={updatePassword} disabled={busy === editing.id}>Cambiar contraseña</button></div></section>}
  </div>;
}
