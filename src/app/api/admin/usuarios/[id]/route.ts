import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/guards";
import {
  nombreSchema,
  passwordSchema,
  readJsonBody,
  staffEmailSchema,
  usernameSchema,
  validate,
} from "@/lib/validation";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdminSession();
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const { id } = await props.params;
    const bodyParsed = await readJsonBody(request);
    if (!bodyParsed.ok) return bodyParsed.response;
    const body = (bodyParsed.data ?? {}) as Record<string, unknown>;
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

    if (targetUser.role === "SUPER_ADMIN" && id !== session.id) {
      return NextResponse.json({ success: false, error: "No podés modificar otra cuenta de administrador." }, { status: 403 });
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
          email: true,
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
      const passwordParsed = validate(
        passwordSchema(
          12,
          "La nueva contraseña debe tener al menos 12 caracteres."
        ),
        body.password
      );
      if (!passwordParsed.ok) return passwordParsed.response;
      const password = passwordParsed.data;

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
      const perfilBody = body as {
        nombre?: unknown;
        role?: unknown;
        username?: unknown;
        email?: unknown;
      };
      const nombreParsed = validate(
        nombreSchema(2, "El nombre completo debe tener al menos 2 caracteres."),
        perfilBody.nombre
      );
      if (!nombreParsed.ok) return nombreParsed.response;
      const nombre = nombreParsed.data;

      const rawUsername = perfilBody.username;
      const cleanUsername = rawUsername
        ? String(rawUsername).trim().toLowerCase()
        : targetUser.username;
      const usernameParsed = validate(usernameSchema, cleanUsername);
      if (!usernameParsed.ok) return usernameParsed.response;

      const emailParsed = perfilBody.email === undefined || perfilBody.email === ""
        ? { ok: true as const, data: targetUser.email }
        : validate(staffEmailSchema, perfilBody.email);
      if (!emailParsed.ok) return emailParsed.response;
      const email = emailParsed.data;
      if (email && email !== targetUser.email) {
        const existingEmail = await prisma.usuario.findUnique({ where: { email } });
        if (existingEmail) return NextResponse.json({ success: false, error: "Ese email ya está registrado." }, { status: 400 });
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

      if (perfilBody.role !== undefined && perfilBody.role !== targetUser.role) {
        return NextResponse.json(
          { success: false, error: "El nivel de acceso no se puede cambiar desde aquí." },
          { status: 400 }
        );
      }

      const updated = await prisma.usuario.update({
        where: { id },
        data: {
          nombre: nombre.trim(),
          username: cleanUsername,
          email,
        },
        select: {
          id: true,
          username: true,
          email: true,
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
    const auth = await requireSuperAdminSession();
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

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "No podés dar de baja una cuenta de administrador." }, { status: 403 });
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
