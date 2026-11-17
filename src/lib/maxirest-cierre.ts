import { createHash } from "node:crypto";

export interface TicketCierre {
  mesa: string;
  tipoFactura: string;
  numeroFactura: string;
  monto: number;
  clave: string;
}

export interface CierreTurno {
  sucursal: string;
  cuit: string;
  fecha: string;
  turnoNumero: number;
  turnoNombre: string;
  cierreNumero: string;
  totalVentas: number;
  cantidadFacturas: number;
  huellaArchivo: string;
  tickets: TicketCierre[];
}

const meses: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

function centavos(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  // Maxirest writes decimal amounts with a dot, without a thousands separator.
  const amount = /^\d+\.\d{2}$/.test(value) ? Number(value) : Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("El cierre contiene un importe inválido.");
  return Math.round(amount * 100);
}

export function parseMaxirestText(text: string, huellaArchivo: string): CierreTurno {
  const normalized = text.replace(/\r/g, "");
  if (!/LA ENCONTRADA/i.test(normalized) || !/RESUMEN DE VENTAS/i.test(normalized)) {
    throw new Error("El PDF no parece ser un cierre de turno de La Encontrada.");
  }
  const sucursal = normalized.match(/Sucursal:\s*([A-Z0-9-]+)/i)?.[1];
  const cuit = normalized.match(/CUIT:\s*([\d-]+)/i)?.[1];
  const fechaMatch = normalized.match(/\b(\d{1,2}) de ([A-Za-záéíóú]+) de (\d{4})\b/i);
  const turnoMatch = normalized.match(/Turno\s+(\d+)\s*\[([^\]]+)\]/i);
  const cierreNumero = normalized.match(/Cierre\s+n[^\d\n]{0,4}(\d+)/i)?.[1];
  if (!sucursal || !cuit || !fechaMatch || !turnoMatch || !cierreNumero) {
    throw new Error("Faltan datos de sucursal, fecha, turno o número de cierre en el PDF.");
  }
  const mes = meses[fechaMatch[2].toLowerCase()];
  const dia = Number(fechaMatch[1]);
  const anio = Number(fechaMatch[3]);
  if (!mes || dia < 1 || dia > 31 || anio < 2000) throw new Error("La fecha del cierre no es válida.");
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const summary = normalized.slice(normalized.indexOf("RESUMEN DE VENTAS"));
  const totalMatch = summary.match(/^TOTAL\s+([\d.,]+)\s+(\d+)\s*$/m);
  if (!totalMatch) throw new Error("No se encontró el total de ventas del cierre.");
  const totalCentavos = centavos(totalMatch[1]);
  const cantidadFacturas = Number(totalMatch[2]);

  const lines = normalized.split("\n").map((line) => line.trim());
  const tickets: TicketCierre[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < lines.length - 1; index++) {
    const mesaLine = lines[index].match(/^Mesa\s*([A-Z]\d+)\b.*\b(FC[A-Z])\s*$/i);
    if (!mesaLine) continue;
    const invoiceLine = lines[index + 1].match(/^(\d{4}-\d{8})\s*\$\s*([\d.,]+)\s*$/);
    if (!invoiceLine) throw new Error(`No se pudo leer la factura de la mesa ${mesaLine[1]}.`);
    const numeroFactura = invoiceLine[1];
    const clave = `${cuit}:${numeroFactura}`;
    if (seen.has(clave)) throw new Error(`La factura ${numeroFactura} aparece repetida en el cierre.`);
    seen.add(clave);
    tickets.push({
      mesa: mesaLine[1].toUpperCase(),
      tipoFactura: mesaLine[2].toUpperCase(),
      numeroFactura,
      monto: centavos(invoiceLine[2]) / 100,
      clave,
    });
    index++;
  }
  const sumaCentavos = tickets.reduce((sum, ticket) => sum + Math.round(ticket.monto * 100), 0);
  if (tickets.length === 0 || tickets.length !== cantidadFacturas || sumaCentavos !== totalCentavos) {
    throw new Error("Las facturas detectadas no coinciden con el total del cierre. No se acreditarán puntos.");
  }
  if (tickets.length > 100) throw new Error("El cierre tiene más de 100 facturas; dividí la carga en lotes más pequeños.");

  return {
    sucursal: sucursal.toUpperCase(), cuit, fecha,
    turnoNumero: Number(turnoMatch[1]), turnoNombre: turnoMatch[2].trim(),
    cierreNumero, totalVentas: totalCentavos / 100, cantidadFacturas,
    huellaArchivo, tickets,
  };
}

export async function readMaxirestPdf(bytes: Uint8Array): Promise<CierreTurno> {
  if (bytes.length < 100 || bytes.length > 5 * 1024 * 1024 ||
      new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new Error("Subí un PDF de cierre de turno válido de hasta 5 MB.");
  }
  const huellaArchivo = createHash("sha256").update(bytes).digest("hex");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: bytes, useSystemFonts: true });
  try {
    const document = await task.promise;
    if (document.numPages > 50) throw new Error("El cierre excede las 50 páginas permitidas.");
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
      page.cleanup();
    }
    return parseMaxirestText(pages.join("\n"), huellaArchivo);
  } finally {
    await task.destroy();
  }
}
