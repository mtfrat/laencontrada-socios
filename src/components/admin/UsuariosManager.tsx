"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Utensils,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  X,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Receipt,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

interface UsuarioItem {
  id: string;
  username: string;
  nombre: string;
  role: "ADMIN" | "MOZO" | "CAJERO";
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    visitasRegistradas: number;
    canjesValidados: number;
  };
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Notificaciones
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Nuevo Usuario
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoUsername, setNuevoUsername] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRole, setNuevoRole] = useState<"ADMIN" | "MOZO" | "CAJERO">("MOZO");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [mostrarNuevoPassword, setMostrarNuevoPassword] = useState(false);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  // Modal Cambiar Contraseña
  const [modalPasswordUser, setModalPasswordUser] = useState<UsuarioItem | null>(null);
  const [nuevoPasswordInput, setNuevoPasswordInput] = useState("");
  const [mostrarPasswordModal, setMostrarPasswordModal] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Modal Editar Perfil
  const [modalEditarUser, setModalEditarUser] = useState<UsuarioItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "MOZO" | "CAJERO">("MOZO");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        setErrorMessage(data.error || "No se pudo cargar el listado de personal.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar el personal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Crear Usuario
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNuevo(null);

    if (!nuevoUsername.trim() || !nuevoNombre.trim() || !nuevoPassword.trim()) {
      setErrorNuevo("Todos los campos marcados son obligatorios.");
      return;
    }

    setGuardandoNuevo(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nuevoUsername.trim().toLowerCase(),
          nombre: nuevoNombre.trim(),
          role: nuevoRole,
          password: nuevoPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) => [data.usuario, ...prev]);
        showToast(data.message);
        setModalNuevo(false);
        setNuevoUsername("");
        setNuevoNombre("");
        setNuevoPassword("");
        setNuevoRole("MOZO");
      } else {
        setErrorNuevo(data.error || "Error al crear el colaborador.");
      }
    } catch {
      setErrorNuevo("Error de comunicación con el servidor.");
    } finally {
      setGuardandoNuevo(false);
    }
  };

  // Alternar Activo / Pausado
  const handleToggleActivo = async (user: UsuarioItem) => {
    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_activo",
          activo: !user.activo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, activo: data.usuario.activo } : u))
        );
        showToast(data.message);
      } else {
        setErrorMessage(data.error);
      }
    } catch {
      setErrorMessage("Error al cambiar estado de acceso.");
    }
  };

  // Resetear Contraseña
  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPasswordUser) return;
    if (nuevoPasswordInput.trim().length < 4) {
      alert("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setGuardandoPassword(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${modalPasswordUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cambiar_password",
          password: nuevoPasswordInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalPasswordUser(null);
        setNuevoPasswordInput("");
      } else {
        alert(data.error || "No se pudo actualizar la contraseña.");
      }
    } catch {
      alert("Error de red al actualizar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  // Guardar Edición Perfil
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarUser) return;

    setGuardandoEdit(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${modalEditarUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editar_perfil",
          nombre: editNombre.trim(),
          username: editUsername.trim().toLowerCase(),
          role: editRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === modalEditarUser.id ? { ...u, ...data.usuario } : u))
        );
        showToast(data.message);
        setModalEditarUser(null);
      } else {
        alert(data.error || "No se pudo actualizar el perfil.");
      }
    } catch {
      alert("Error de red al guardar los cambios.");
    } finally {
      setGuardandoEdit(false);
    }
  };

  // Eliminar o Desactivar
  const handleEliminarUsuario = async (user: UsuarioItem) => {
    if (!confirm(`¿Confirmas la baja del usuario ${user.nombre} (@${user.username})?`)) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsuarios();
      } else {
        alert(data.error || "No se pudo procesar la baja.");
      }
    } catch {
      alert("Error de red.");
    }
  };

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Conteos
  const totalMozos = usuarios.filter((u) => u.role === "MOZO" && u.activo).length;
  const totalAdmins = usuarios.filter((u) => u.role === "ADMIN" && u.activo).length;
  const totalCajeros = usuarios.filter((u) => u.role === "CAJERO" && u.activo).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d0708] border border-[#5c131d]/60 text-[#f5ede6] px-4 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-[#3a0b12]/60 border border-red-800 text-red-200 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Métricas del Equipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#ce7281] border border-[#5c131d]/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono text-[#f5ede6]/50 font-semibold">Total Equipo</p>
            <p className="text-xl font-bold font-mono text-white">{usuarios.length}</p>
          </div>
        </div>

        <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4aa58]/15 text-[#d4aa58] border border-[#d4aa58]/30 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono text-[#f5ede6]/50 font-semibold">Mozos Salón</p>
            <p className="text-xl font-bold font-mono text-[#d4aa58]">{totalMozos}</p>
          </div>
        </div>

        <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 text-sky-400 border border-sky-800/40 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono text-[#f5ede6]/50 font-semibold">Cajeros</p>
            <p className="text-xl font-bold font-mono text-sky-400">{totalCajeros}</p>
          </div>
        </div>

        <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5c131d]/20 text-[#e18693] border border-[#5c131d]/40 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono text-[#f5ede6]/50 font-semibold">Gerencia</p>
            <p className="text-xl font-bold font-mono text-[#e18693]">{totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Top Bar: Live Search & Botón Nuevo */}
      <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#f5ede6]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, usuario o rol..."
            className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#f5ede6] placeholder-[#f5ede6]/30 focus:outline-none focus:border-[#5c131d] focus:ring-1 focus:ring-[#5c131d]/40 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5ede6]/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorNuevo(null);
            setModalNuevo(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-[#5c131d] hover:bg-[#731925] text-white font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-[#5c131d]/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Nuevo Colaborador</span>
        </button>
      </div>

      {/* Listado de Personal */}
      <div className="bg-[#0d0708] border border-[#5c131d]/25 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-[#f5ede6]/50 space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#5c131d]" />
            <p className="text-xs">Cargando nómina de colaboradores...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-[#f5ede6]/50">
            <Users className="w-12 h-12 mx-auto mb-2 text-[#5c131d]/40" />
            <p className="font-semibold text-white">No se encontraron usuarios</p>
            <p className="text-xs text-[#f5ede6]/40 mt-1">Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#f5ede6]/80">
              <thead className="bg-[#070405] border-b border-[#5c131d]/20 text-[11px] uppercase tracking-wider text-[#f5ede6]/50 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4 font-mono">Usuario</th>
                  <th className="py-3.5 px-4 text-center">Rol</th>
                  <th className="py-3.5 px-4 text-center">Actividad en Salón</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5c131d]/15">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-[#150c0e]/50 transition">
                    {/* Nombre y Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#150c0e] border border-[#5c131d]/30 text-white font-bold flex items-center justify-center text-xs font-serif">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{u.nombre}</p>
                          <p className="text-[10px] text-[#f5ede6]/40 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Alta: {new Date(u.createdAt).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono font-semibold text-[#f5ede6]/90">
                      @{u.username}
                    </td>

                    {/* Rol */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          u.role === "ADMIN"
                            ? "bg-[#5c131d]/25 text-[#e18693] border-[#5c131d]/50"
                            : u.role === "MOZO"
                            ? "bg-[#d4aa58]/15 text-[#d4aa58] border-[#d4aa58]/30"
                            : "bg-sky-950/60 text-sky-400 border-sky-800/40"
                        }`}
                      >
                        {u.role === "ADMIN" && <Shield className="w-3 h-3" />}
                        {u.role === "MOZO" && <Utensils className="w-3 h-3" />}
                        {u.role === "CAJERO" && <Receipt className="w-3 h-3" />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* Actividad */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-3 font-mono text-[11px]">
                        <span title="Mesas / Visitas cargadas en salón" className="text-[#f5ede6]/70">
                          🍽️ {u._count?.visitasRegistradas || 0} visitas
                        </span>
                        <span title="Canjes de cupones QR validados" className="text-[#d4aa58]">
                          🎁 {u._count?.canjesValidados || 0} canjes
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          u.activo
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {u.activo ? "Activo" : "Pausado"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Cambiar Contraseña */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalPasswordUser(u);
                            setNuevoPasswordInput("");
                            setMostrarPasswordModal(false);
                          }}
                          className="p-1.5 bg-[#150c0e] hover:bg-[#5c131d] hover:text-white text-[#d4aa58] rounded-xl font-bold transition border border-[#5c131d]/30"
                          title="Cambiar contraseña de acceso"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Editar Perfil */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalEditarUser(u);
                            setEditNombre(u.nombre);
                            setEditUsername(u.username);
                            setEditRole(u.role);
                          }}
                          className="p-1.5 bg-[#150c0e] hover:bg-[#1f1013] text-[#f5ede6]/70 hover:text-white rounded-xl transition border border-[#5c131d]/30"
                          title="Editar nombre, usuario o rol"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Switch Activar / Pausar */}
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(u)}
                          className="p-1 text-[#f5ede6]/40 hover:text-white rounded-lg transition"
                          title={u.activo ? "Pausar acceso" : "Habilitar acceso"}
                        >
                          {u.activo ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-[#f5ede6]/30" />
                          )}
                        </button>

                        {/* Botón Eliminar / Dar de baja */}
                        <button
                          type="button"
                          onClick={() => handleEliminarUsuario(u)}
                          className="p-1.5 bg-[#150c0e] hover:bg-red-950/60 text-[#f5ede6]/40 hover:text-red-400 rounded-xl transition border border-[#5c131d]/30"
                          title="Eliminar o suspender usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR NUEVO COLABORADOR */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-black/90 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5c131d]/20 text-[#d4aa58] border border-[#5c131d]/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Nuevo Colaborador</h3>
                  <p className="text-[11px] text-[#f5ede6]/50">Acceso a terminal de salón o administración</p>
                </div>
              </div>
              <button
                onClick={() => setModalNuevo(false)}
                className="text-[#f5ede6]/40 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorNuevo && (
              <div className="p-3 bg-[#3a0b12]/60 border border-red-800/80 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorNuevo}</span>
              </div>
            )}

            <form onSubmit={handleCrearUsuario} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                    Usuario de Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: mozo2"
                    value={nuevoUsername}
                    onChange={(e) => setNuevoUsername(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] font-mono text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                    Rol Asignado *
                  </label>
                  <select
                    value={nuevoRole}
                    onChange={(e) => setNuevoRole(e.target.value as any)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  >
                    <option value="MOZO">MOZO (Salón)</option>
                    <option value="CAJERO">CAJERO (Caja)</option>
                    <option value="ADMIN">ADMIN (Gerencia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Contraseña Inicial *
                </label>
                <div className="relative">
                  <input
                    type={mostrarNuevoPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 pr-10 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNuevoPassword(!mostrarNuevoPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5ede6]/40 hover:text-white"
                  >
                    {mostrarNuevoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#f5ede6]/40 mt-1">
                  El colaborador ingresará con este usuario y clave en <span className="font-mono text-[#d4aa58]">/staff/login</span>.
                </p>
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5c131d]/20">
                <button
                  type="button"
                  disabled={guardandoNuevo}
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl text-[#f5ede6]/50 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoNuevo}
                  className="px-5 py-2 rounded-xl font-bold bg-[#5c131d] hover:bg-[#731925] text-white shadow-lg shadow-[#5c131d]/30 transition flex items-center gap-1.5"
                >
                  {guardandoNuevo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar Colaborador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CAMBIAR / RESETEAR CONTRASEÑA */}
      {modalPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-black/90 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#d4aa58]" />
                <h3 className="text-base font-bold text-white font-serif">Cambiar Contraseña</h3>
              </div>
              <button
                onClick={() => setModalPasswordUser(null)}
                className="text-[#f5ede6]/40 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#050304] rounded-2xl p-3 border border-[#5c131d]/25">
              <p className="font-bold text-white text-sm">{modalPasswordUser.nombre}</p>
              <p className="text-[11px] font-mono text-[#f5ede6]/50">
                Usuario: @{modalPasswordUser.username} • Rol: {modalPasswordUser.role}
              </p>
            </div>

            <form onSubmit={handleCambiarPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={mostrarPasswordModal ? "text" : "password"}
                    required
                    placeholder="Escribe la nueva contraseña..."
                    value={nuevoPasswordInput}
                    onChange={(e) => setNuevoPasswordInput(e.target.value)}
                    className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 pr-10 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordModal(!mostrarPasswordModal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5ede6]/40 hover:text-white"
                  >
                    {mostrarPasswordModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5c131d]/20">
                <button
                  type="button"
                  disabled={guardandoPassword}
                  onClick={() => setModalPasswordUser(null)}
                  className="px-4 py-2 rounded-xl text-[#f5ede6]/50 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoPassword}
                  className="px-5 py-2 rounded-xl font-bold bg-[#5c131d] hover:bg-[#731925] text-white shadow-lg shadow-[#5c131d]/30 transition flex items-center gap-1.5"
                >
                  {guardandoPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Nueva Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR PERFIL & ROL */}
      {modalEditarUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0708] border border-[#5c131d]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-black/90 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#5c131d]/20 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#ce7281]" />
                <h3 className="text-base font-bold text-white font-serif">Editar Colaborador</h3>
              </div>
              <button
                onClick={() => setModalEditarUser(null)}
                className="text-[#f5ede6]/40 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Usuario de Login (@) *
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] font-mono text-sm focus:outline-none focus:border-[#5c131d]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#f5ede6]/80 mb-1">
                  Rol en el Sistema *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-[#050304] border border-[#5c131d]/30 rounded-xl px-3 py-2 text-[#f5ede6] text-sm focus:outline-none focus:border-[#5c131d]"
                >
                  <option value="MOZO">MOZO (Terminal de Salón /pos)</option>
                  <option value="CAJERO">CAJERO (Caja y Salón)</option>
                  <option value="ADMIN">ADMIN (Acceso Total a Gerencia)</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5c131d]/20">
                <button
                  type="button"
                  disabled={guardandoEdit}
                  onClick={() => setModalEditarUser(null)}
                  className="px-4 py-2 rounded-xl text-[#f5ede6]/50 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoEdit}
                  className="px-5 py-2 rounded-xl font-bold bg-[#5c131d] hover:bg-[#731925] text-white shadow-lg shadow-[#5c131d]/30 transition flex items-center gap-1.5"
                >
                  {guardandoEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
