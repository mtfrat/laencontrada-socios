CREATE TYPE "OrigenAcreditacion" AS ENUM ('MANUAL', 'CIERRE_PDF');

ALTER TABLE "TicketAcreditado"
  ADD COLUMN "origen" "OrigenAcreditacion" NOT NULL DEFAULT 'CIERRE_PDF',
  ALTER COLUMN "cuit" DROP NOT NULL,
  ALTER COLUMN "sucursal" DROP NOT NULL,
  ALTER COLUMN "mesa" DROP NOT NULL,
  ALTER COLUMN "cierreNumero" DROP NOT NULL,
  ALTER COLUMN "turnoNumero" DROP NOT NULL;

DROP INDEX "TicketAcreditado_numeroFactura_idx";
CREATE UNIQUE INDEX "TicketAcreditado_numeroFactura_key" ON "TicketAcreditado"("numeroFactura");
