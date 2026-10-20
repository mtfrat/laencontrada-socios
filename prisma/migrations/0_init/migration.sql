-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'MOZO', 'CAJERO');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('CONSUMO', 'ENCUESTA', 'REFERIDO', 'AJUSTE_MANUAL', 'CANJE_PREMIO');

-- CreateEnum
CREATE TYPE "EstadoCanje" AS ENUM ('PENDIENTE', 'COMPLETADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FranjaHoraria" AS ENUM ('ALMUERZO', 'CENA', 'TARDE', 'OTRO');

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "numeroSocio" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "puntosActuales" INTEGER NOT NULL DEFAULT 0,
    "puntosHistoricos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" "RolUsuario" NOT NULL DEFAULT 'MOZO',
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitaConsumo" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "registradoPorId" TEXT,
    "fechaVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "franjaHoraria" "FranjaHoraria" NOT NULL DEFAULT 'CENA',
    "montoTotalTicket" DECIMAL(12,2) NOT NULL,
    "cantidadComensales" INTEGER NOT NULL DEFAULT 1,
    "gastoPromedioPorPersona" DECIMAL(12,2) NOT NULL,
    "puntosAcreditados" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitaConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPlatoConsumido" (
    "id" TEXT NOT NULL,
    "visitaConsumoId" TEXT NOT NULL,
    "nombrePlato" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "notas" TEXT,

    CONSTRAINT "ItemPlatoConsumido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAdjunto" (
    "id" TEXT NOT NULL,
    "visitaConsumoId" TEXT NOT NULL,
    "urlArchivo" TEXT,
    "numeroTicketFiscal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaccionPuntos" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "registradoPorId" TEXT,
    "tipo" "TipoTransaccion" NOT NULL,
    "puntos" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaccionPuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "puntosRequeridos" INTEGER NOT NULL,
    "imagenUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT -1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Premio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanjePremio" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "premioId" TEXT NOT NULL,
    "validadoPorId" TEXT,
    "codigoQR" TEXT NOT NULL,
    "estado" "EstadoCanje" NOT NULL DEFAULT 'PENDIENTE',
    "puntosGastados" INTEGER NOT NULL,
    "fechaExpiracion" TIMESTAMP(3) NOT NULL,
    "fechaCanje" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanjePremio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionPuntos" (
    "id" TEXT NOT NULL,
    "pesosPorPunto" DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    "puntosPorEncuesta" INTEGER NOT NULL DEFAULT 10,
    "puntosPorReferido" INTEGER NOT NULL DEFAULT 5,
    "minutosValidezQRCanje" INTEGER NOT NULL DEFAULT 15,
    "encuestaActiva" BOOLEAN NOT NULL DEFAULT true,
    "encuestaUnaVezPorSocio" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionPuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaEncuesta" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "categoria" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreguntaEncuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaEncuesta" (
    "id" TEXT NOT NULL,
    "visitaConsumoId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "puntosOtorgados" INTEGER NOT NULL DEFAULT 10,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaEncuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRespuestaEncuesta" (
    "id" TEXT NOT NULL,
    "respuestaEncuestaId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "ItemRespuestaEncuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Socio_numeroSocio_key" ON "Socio"("numeroSocio");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_dni_key" ON "Socio"("dni");

-- CreateIndex
CREATE INDEX "Socio_dni_idx" ON "Socio"("dni");

-- CreateIndex
CREATE INDEX "Socio_numeroSocio_idx" ON "Socio"("numeroSocio");

-- CreateIndex
CREATE INDEX "Socio_puntosHistoricos_idx" ON "Socio"("puntosHistoricos" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE INDEX "VisitaConsumo_socioId_idx" ON "VisitaConsumo"("socioId");

-- CreateIndex
CREATE INDEX "VisitaConsumo_fechaVisita_idx" ON "VisitaConsumo"("fechaVisita");

-- CreateIndex
CREATE INDEX "ItemPlatoConsumido_visitaConsumoId_idx" ON "ItemPlatoConsumido"("visitaConsumoId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketAdjunto_visitaConsumoId_key" ON "TicketAdjunto"("visitaConsumoId");

-- CreateIndex
CREATE INDEX "TransaccionPuntos_socioId_idx" ON "TransaccionPuntos"("socioId");

-- CreateIndex
CREATE INDEX "TransaccionPuntos_createdAt_idx" ON "TransaccionPuntos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CanjePremio_codigoQR_key" ON "CanjePremio"("codigoQR");

-- CreateIndex
CREATE INDEX "CanjePremio_codigoQR_idx" ON "CanjePremio"("codigoQR");

-- CreateIndex
CREATE INDEX "CanjePremio_socioId_idx" ON "CanjePremio"("socioId");

-- CreateIndex
CREATE INDEX "CanjePremio_estado_idx" ON "CanjePremio"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaEncuesta_visitaConsumoId_key" ON "RespuestaEncuesta"("visitaConsumoId");

-- CreateIndex
CREATE INDEX "RespuestaEncuesta_socioId_idx" ON "RespuestaEncuesta"("socioId");

-- CreateIndex
CREATE INDEX "ItemRespuestaEncuesta_respuestaEncuestaId_idx" ON "ItemRespuestaEncuesta"("respuestaEncuestaId");

-- CreateIndex
CREATE INDEX "ItemRespuestaEncuesta_preguntaId_idx" ON "ItemRespuestaEncuesta"("preguntaId");

-- AddForeignKey
ALTER TABLE "VisitaConsumo" ADD CONSTRAINT "VisitaConsumo_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaConsumo" ADD CONSTRAINT "VisitaConsumo_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPlatoConsumido" ADD CONSTRAINT "ItemPlatoConsumido_visitaConsumoId_fkey" FOREIGN KEY ("visitaConsumoId") REFERENCES "VisitaConsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjunto" ADD CONSTRAINT "TicketAdjunto_visitaConsumoId_fkey" FOREIGN KEY ("visitaConsumoId") REFERENCES "VisitaConsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionPuntos" ADD CONSTRAINT "TransaccionPuntos_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionPuntos" ADD CONSTRAINT "TransaccionPuntos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanjePremio" ADD CONSTRAINT "CanjePremio_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanjePremio" ADD CONSTRAINT "CanjePremio_premioId_fkey" FOREIGN KEY ("premioId") REFERENCES "Premio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanjePremio" ADD CONSTRAINT "CanjePremio_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaEncuesta" ADD CONSTRAINT "RespuestaEncuesta_visitaConsumoId_fkey" FOREIGN KEY ("visitaConsumoId") REFERENCES "VisitaConsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaEncuesta" ADD CONSTRAINT "RespuestaEncuesta_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRespuestaEncuesta" ADD CONSTRAINT "ItemRespuestaEncuesta_respuestaEncuestaId_fkey" FOREIGN KEY ("respuestaEncuestaId") REFERENCES "RespuestaEncuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRespuestaEncuesta" ADD CONSTRAINT "ItemRespuestaEncuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaEncuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

