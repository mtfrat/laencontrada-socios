CREATE TABLE "AccesoSocioCodigo" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "venceAt" TIMESTAMP(3) NOT NULL,
    "usadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccesoSocioCodigo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccesoSocioCodigo_socioId_createdAt_idx" ON "AccesoSocioCodigo"("socioId", "createdAt");
CREATE INDEX "AccesoSocioCodigo_ipHash_createdAt_idx" ON "AccesoSocioCodigo"("ipHash", "createdAt");
ALTER TABLE "AccesoSocioCodigo" ADD CONSTRAINT "AccesoSocioCodigo_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
