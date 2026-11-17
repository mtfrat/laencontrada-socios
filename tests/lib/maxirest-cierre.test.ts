import { describe, expect, it } from "vitest";
import { parseMaxirestText } from "@/lib/maxirest-cierre";

const cierre = `LA ENCONTRADA
Sucursal: LE
CUIT: 27-23754536-8
TOTALES DEL DIA:
Sábado 12 de Septiembre de 2026
Turno 2 [Noche]
Cierre n| 1011.
RESUMEN DE VENTAS
Detalle Total Cant
TOTAL 124950.00 3
Factura B 124950.00 3
AUDITORIA
MesaA14 Mozo 1 Aper.21:00
21:01 Anulación de Salón A14, $302000.00
MesaA8 Mozo 1 Aper.20:43 FCB
0001-00001362 $ 24650.00
00:05 Emisión de control de mesa n|
00002694 [Importe $ 24650.00
MesaA7 Mozo 1 Aper.20:46 FCB
0001-00001363 $ 22950.00
MesaA13 Mozo 1 Aper.21:00 FCB
0001-00001364 $ 77350.00
00:07 Emisión de control de mesa n|
00002697 [Importe $ 90950.00
** FIN AUDITORIA **`;

describe("lectura de cierre Maxirest", () => {
  it("extrae solo las facturas finales y valida el total", () => {
    const report = parseMaxirestText(cierre, "huella");
    expect(report).toMatchObject({ fecha: "2026-09-12", cierreNumero: "1011", turnoNombre: "Noche", totalVentas: 124950, cantidadFacturas: 3 });
    expect(report.tickets.map((ticket) => [ticket.mesa, ticket.numeroFactura, ticket.monto])).toEqual([
      ["A8", "0001-00001362", 24650],
      ["A7", "0001-00001363", 22950],
      ["A13", "0001-00001364", 77350],
    ]);
  });

  it("detiene la carga si el total y las facturas no coinciden", () => {
    expect(() => parseMaxirestText(cierre.replace("TOTAL 124950.00 3", "TOTAL 125950.00 3"), "huella")).toThrow(/no coinciden/);
    expect(() => parseMaxirestText(cierre.replace("MesaA13 Mozo 1 Aper.21:00 FCB", "MesaA13 Mozo 1 Aper.21:00"), "huella")).toThrow(/no coinciden/);
  });
});
