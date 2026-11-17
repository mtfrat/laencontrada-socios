CREATE TABLE "TicketAcreditado" (
  "id" TEXT NOT NULL,
  "clave" TEXT NOT NULL,
  "cuit" TEXT NOT NULL,
  "sucursal" TEXT NOT NULL,
  "numeroFactura" TEXT NOT NULL,
  "mesa" TEXT NOT NULL,
  "cierreNumero" TEXT NOT NULL,
  "turnoNumero" INTEGER NOT NULL,
  "fechaTurno" TIMESTAMP(3) NOT NULL,
  "montoTotalTicket" DECIMAL(12,2) NOT NULL,
  "cantidadComensales" INTEGER NOT NULL,
  "registradoPorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketAcreditado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketAcreditado_clave_key" ON "TicketAcreditado"("clave");
CREATE INDEX "TicketAcreditado_fechaTurno_idx" ON "TicketAcreditado"("fechaTurno");
CREATE INDEX "TicketAcreditado_numeroFactura_idx" ON "TicketAcreditado"("numeroFactura");
ALTER TABLE "TicketAcreditado" ADD CONSTRAINT "TicketAcreditado_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
