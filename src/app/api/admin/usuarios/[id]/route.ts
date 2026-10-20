import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { RolUsuario } from "@prisma/client";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await props.params;
    const body = await request.json();
    const { action } = body;

    const targetUser = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    // 1. Alternar Estado Activo / Pausado
    if (action === "toggle_activo") {
      const nuevoEstado = typeof body.activo === "boolean" ? body.activo : !targetUser.activo;

      // Prevenir auto-bloqueo del admin logueado
      if (id === session.id && !nuevoEstado) {
        return NextResponse.json(
          { success: false, error: "No puedes desactivar tu propia cuenta de administrador." },
          { status: 400 }
        );
      }

      const updated = await prisma.usuario.update({
        where: { id },
        data: { activo: nuevoEstado },
        select: {
          id: true,
          username: true,
          nombre: true,
          role: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        usuario: updated,
        message: `Cuenta de ${updated.nombre} ${updated.activo ? "activada" : "pausada"} correctamente.`,
      });
    }

    // 2. Cambiar / Resetear Contraseña
    if (action === "cambiar_password") {
      const { password } = body;
      if (!password || typeof password !== "string" || password.length < 4) {
        return NextResponse.json(
          { success: false, error: "La nueva contraseña debe tener al menos 4 caracteres." },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await prisma.usuario.update({
        where: { id },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: `Contraseña de ${targetUser.nombre} (@${targetUser.username}) actualizada con éxito.`,
      });
    }

    // 3. Editar Perfil (Nombre, Rol, Username)
    if (action === "editar_perfil") {
      const { nombre, role, username } = body;

      if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "El nombre completo debe tener al menos 2 caracteres." },
          { status: 400 }
        );
      }

      const cleanUsername = username ? String(username).trim().toLowerCase() : targetUser.username;
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(cleanUsername)) {
        return NextResponse.json(
          {
            success: false,
            error: "El usuario debe tener entre 3 y 20 caracteres y solo contener letras, números o guiones bajos.",
          },
          { status: 400 }
        );
      }

      // Si cambió de username, verificar unicidad
      if (cleanUsername !== targetUser.username) {
        const existing = await prisma.usuario.findUnique({
          where: { username: cleanUsername },
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: `El usuario "${cleanUsername}" ya se encuentra en uso.` },
            { status: 400 }
          );
        }
      }

      const validRoles: RolUsuario[] = ["ADMIN", "MOZO", "CAJERO"];
      const targetRole = role && validRoles.includes(role as RolUsuario) ? (role as RolUsuario) : targetUser.role;

      // Prevenir auto-degradación del admin logueado
      if (id === session.id && targetRole !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "No puedes quitarte el rol de administrador a ti mismo." },
          { status: 400 }
        );
      }

      const updated = await prisma.usuario.update({
        where: { id },
        data: {
          nombre: nombre.trim(),
          username: cleanUsername,
          role: targetRole,
        },
        select: {
          id: true,
          username: true,
          nombre: true,
          role: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              visitasRegistradas: true,
              canjesValidados: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        usuario: updated,
        message: "Datos del colaborador actualizados exitosamente.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Acción no reconocida." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error al actualizar usuario de personal:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar usuario." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await props.params;

    if (id === session.id) {
      return NextResponse.json(
        { success: false, error: "No puedes eliminar tu propia cuenta de administrador." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            visitasRegistradas: true,
            canjesValidados: true,
            transacciones: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const tieneRegistros =
      targetUser._count.visitasRegistradas > 0 ||
      targetUser._count.canjesValidados > 0 ||
      targetUser._count.transacciones > 0;

    if (tieneRegistros) {
      // Baja lógica para mantener integridad de auditoría histórica
      await prisma.usuario.update({
        where: { id },
        data: { activo: false },
      });

      return NextResponse.json({
        success: true,
        message: `El usuario ${targetUser.nombre} tiene historial de visitas/canjes asociados. Se suspendió su acceso para preservar las auditorías.`,
      });
    }

    // Eliminación física si no tiene actividad previa
    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${targetUser.nombre} eliminado permanentemente de la base de datos.`,
    });
  } catch (error) {
    console.error("Error al eliminar colaborador:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al procesar la baja del usuario." },
      { status: 500 }
    );
  }
}
