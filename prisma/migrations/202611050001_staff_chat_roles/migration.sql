ALTER TYPE "RolUsuario" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "RolUsuario" ADD VALUE 'BARRA';
ALTER TYPE "RolUsuario" ADD VALUE 'EQUIPO';

ALTER TABLE "Usuario" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE TABLE "MensajeInterno" (
  "id" TEXT NOT NULL,
  "autorId" TEXT,
  "autorNombre" TEXT NOT NULL,
  "contenido" VARCHAR(2000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MensajeInterno_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MensajeInterno_createdAt_idx" ON "MensajeInterno"("createdAt");
ALTER TABLE "MensajeInterno" ADD CONSTRAINT "MensajeInterno_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
