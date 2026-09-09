import { PrismaClient, RolUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos iniciales (seed)...");

  // 1. Configuracion de Puntos
  const existingConfig = await prisma.configuracionPuntos.findFirst();
  if (!existingConfig) {
    await prisma.configuracionPuntos.create({
      data: {
        pesosPorPunto: 1000.0,
        puntosPorEncuesta: 10,
        puntosPorReferido: 5,
        minutosValidezQRCanje: 15,
      },
    });
    console.log("Configuración global de puntos creada.");
  }

  // 2. Usuarios del Restaurante
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordMozo = await bcrypt.hash("mozo123", 10);

  await prisma.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      nombre: "Administrador General",
      role: RolUsuario.ADMIN,
      passwordHash: passwordAdmin,
    },
  });

  await prisma.usuario.upsert({
    where: { username: "mozo1" },
    update: {},
    create: {
      username: "mozo1",
      nombre: "Martín Mozo",
      role: RolUsuario.MOZO,
      passwordHash: passwordMozo,
    },
  });
  console.log("Usuarios de personal (admin, mozo1) listos.");

  // 3. Premios Iniciales
  const premiosData = [
    {
      titulo: "Postre de la Casa a elección",
      descripcion: "Flan casero mixto, panqueque con dulce de leche o bocha de helado artesanal.",
      puntosRequeridos: 100,
      stock: -1,
    },
    {
      titulo: "Copa de Vino Malbec Selección",
      descripcion: "Copa de vino de alta gama de la bodega de la casa.",
      puntosRequeridos: 150,
      stock: -1,
    },
    {
      titulo: "Botella de Vino Reserva La Encontrada",
      descripcion: "Botella de etiqueta exclusiva para disfrutar en salón o llevar.",
      puntosRequeridos: 400,
      stock: 20,
    },
    {
      titulo: "Corte Especial a la Parrilla (2 personas)",
      descripcion: "Ojo de bife o asado de tira con guarnición de papas rústicas o ensalada.",
      puntosRequeridos: 950,
      stock: 10,
    },
  ];

  for (const p of premiosData) {
    const existing = await prisma.premio.findFirst({ where: { titulo: p.titulo } });
    if (!existing) {
      await prisma.premio.create({ data: p });
    }
  }
  console.log("Catálogo inicial de premios listo.");

  // 4. Socio de Demostración
  await prisma.socio.upsert({
    where: { dni: "12345678" },
    update: {},
    create: {
      numeroSocio: "SOC-001",
      dni: "12345678",
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "1123456789",
      email: "juan.perez@ejemplo.com",
      puntosActuales: 250,
      puntosHistoricos: 550,
    },
  });
  console.log("Socio de prueba (DNI: 12345678) listo.");

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
