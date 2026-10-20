import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function parseDate(dateStr: string): Date {
  try {
    const [datePart, timePart] = dateStr.trim().split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    let hours = 0;
    let mins = 0;
    let secs = 0;
    if (timePart) {
      const parts = timePart.split(":").map(Number);
      hours = parts[0] || 0;
      mins = parts[1] || 0;
      secs = parts[2] || 0;
    }
    const d = new Date(year, month - 1, day, hours, mins, secs);
    if (isNaN(d.getTime())) return new Date();
    return d;
  } catch {
    return new Date();
  }
}

function cleanEmail(emailRaw: string): string | null {
  if (!emailRaw) return null;
  const clean = emailRaw.replace(/["'\s]/g, "").replace(/\.+$/, "").toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean : null;
}

function cleanPhone(phoneRaw: string): string | null {
  if (!phoneRaw) return null;
  const clean = phoneRaw.replace(/["'\s_]/g, "").trim();
  return clean.length >= 4 ? clean : null;
}

async function main() {
  console.log("==================================================");
  console.log("  IMPORTADOR MASIVO DE SOCIOS - LA ENCONTRADA     ");
  console.log("==================================================\n");

  const filePath = path.join(process.cwd(), "data", "socios-iniciales.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n").map((l) => l.trim()).filter(Boolean);

  console.log(`Total de líneas en el archivo: ${lines.length}`);
  const header = parseCSVLine(lines[0]);
  console.log(`Columnas detectadas: ${header.length}`);

  interface SocioRecord {
    dni: string;
    nombre: string;
    apellido: string | null;
    telefono: string | null;
    email: string | null;
    numSocio: string | null;
    fechaAlta: Date;
    origen: string;
  }

  const sociosMap = new Map<string, SocioRecord>();
  let skippedAnonymous = 0;
  let skippedInvalid = 0;
  let maxNumSocio = 1000;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const rawNombre = (row[3] || "").trim();
    const rawApellido = (row[4] || "").trim();
    const rawDni = (row[5] || row[2] || "").trim();
    const cleanDni = rawDni.replace(/\D/g, "");
    const rawNumSocio = (row[12] || "").trim();
    const rawTel = (row[6] || "").trim();
    const rawMail = (row[10] || "").trim();
    const rawFecha = (row[0] || "").trim();

    // Descartar check-ins de comensales anónimos
    if (!rawNombre) {
      skippedAnonymous++;
      continue;
    }

    if (!cleanDni || cleanDni.length < 5) {
      skippedInvalid++;
      continue;
    }

    const fechaAlta = parseDate(rawFecha);
    const validMail = cleanEmail(rawMail);
    const validTel = cleanPhone(rawTel);

    // Formatear número de socio
    let numSocioStr: string | null = null;
    if (rawNumSocio) {
      const parsedNum = parseInt(rawNumSocio, 10);
      if (!isNaN(parsedNum)) {
        numSocioStr = `SOC-${parsedNum}`;
        if (parsedNum > maxNumSocio) maxNumSocio = parsedNum;
      } else {
        numSocioStr = `SOC-${rawNumSocio}`;
      }
    }

    if (!sociosMap.has(cleanDni)) {
      sociosMap.set(cleanDni, {
        dni: cleanDni,
        nombre: rawNombre,
        apellido: rawApellido || null,
        telefono: validTel,
        email: validMail,
        numSocio: numSocioStr,
        fechaAlta,
        origen: `Línea ${i + 1}`,
      });
    } else {
      // Si ya existe (visita posterior repetida), fusionar con los datos más completos
      const existing = sociosMap.get(cleanDni)!;
      if (!existing.numSocio && numSocioStr) existing.numSocio = numSocioStr;
      if (!existing.email && validMail) existing.email = validMail;
      if (!existing.telefono && validTel) existing.telefono = validTel;
      if (!existing.apellido && rawApellido) existing.apellido = rawApellido;
    }
  }

  console.log(`Socios únicos válidos a importar: ${sociosMap.size}`);
  console.log(`Registros de mesa anónimos ignorados: ${skippedAnonymous}`);
  console.log(`Registros con DNI inválido ignorados: ${skippedInvalid}`);
  console.log(`Número de socio máximo asignado en la planilla: SOC-${maxNumSocio}`);

  // Asignar número de socio a aquellos sin número
  let nextNum = maxNumSocio + 1;
  for (const socio of Array.from(sociosMap.values())) {
    if (!socio.numSocio) {
      socio.numSocio = `SOC-${nextNum}`;
      console.log(`  -> Asignando número autoincremental ${socio.numSocio} a ${socio.nombre} ${socio.apellido || ""} (DNI ${socio.dni})`);
      nextNum++;
    }
  }

  // Comprobar colisiones de número de socio dentro de los registros a importar
  const numSocioUsage = new Map<string, string>();
  for (const socio of Array.from(sociosMap.values())) {
    const existingDni = numSocioUsage.get(socio.numSocio!);
    if (existingDni && existingDni !== socio.dni) {
      // Reasignar si hubiera colisión insospechada
      const renum = `SOC-${nextNum++}`;
      console.warn(`  [AVISO] Conflicto de número ${socio.numSocio} entre DNI ${existingDni} y ${socio.dni}. Reasignando a ${renum}.`);
      socio.numSocio = renum;
    }
    numSocioUsage.set(socio.numSocio!, socio.dni);
  }

  // Inserción / Upsert en Supabase PostgreSQL
  console.log("\nGuardando socios en la base de datos de Supabase...");
  let insertados = 0;
  let actualizados = 0;

  for (const socio of Array.from(sociosMap.values())) {
    // Comprobar si ya existe por DNI
    const existingByDni = await prisma.socio.findUnique({
      where: { dni: socio.dni },
    });

    if (existingByDni) {
      await prisma.socio.update({
        where: { dni: socio.dni },
        data: {
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono || existingByDni.telefono,
          email: socio.email || existingByDni.email,
        },
      });
      actualizados++;
    } else {
      // Asegurar que el numeroSocio no colisione con alguno ya existente en BD
      let finalNumSocio = socio.numSocio!;
      const existingByNum = await prisma.socio.findUnique({
        where: { numeroSocio: finalNumSocio },
      });
      if (existingByNum) {
        finalNumSocio = `SOC-${nextNum++}`;
      }

      await prisma.socio.create({
        data: {
          numeroSocio: finalNumSocio,
          dni: socio.dni,
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono,
          email: socio.email,
          puntosActuales: 0,
          puntosHistoricos: 0,
          activo: true,
          fechaAlta: socio.fechaAlta,
        },
      });
      insertados++;
    }
  }

  console.log("\n==================================================");
  console.log("  RESULTADO DE LA MIGRACIÓN");
  console.log("==================================================");
  console.log(`✓ Nuevos socios dados de alta: ${insertados}`);
  console.log(`✓ Socios existentes actualizados: ${actualizados}`);
  const totalEnBd = await prisma.socio.count();
  console.log(`✓ Total de socios en base de datos: ${totalEnBd}`);
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("Error en la importación:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });