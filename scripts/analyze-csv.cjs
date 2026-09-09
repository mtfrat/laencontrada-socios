const fs = require('fs');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
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
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

const lines = fs.readFileSync('data/socios-iniciales.csv', 'utf8').split('\n').map(l => l.trim()).filter(Boolean);

const dnis = new Map();
let maxNum = 0;

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const nombre = (row[3] || '').trim();
  const apellido = (row[4] || '').trim();
  const rawDni = (row[5] || row[2] || '').trim();
  const cleanDni = rawDni.replace(/\D/g, '');
  const numSocio = (row[12] || '').trim();
  const telefono = (row[6] || '').trim();
  const email = (row[10] || '').trim();
  const fechaNac = (row[11] || '').trim();
  const marcaTemporal = (row[0] || '').trim();

  if (nombre && cleanDni.length >= 5) {
    if (!dnis.has(cleanDni)) {
      dnis.set(cleanDni, {
        dni: cleanDni,
        nombre,
        apellido,
        telefono,
        email,
        fechaNac,
        marcaTemporal,
        numSocio: numSocio || null,
      });
    } else {
      // merge with best info
      const existing = dnis.get(cleanDni);
      if (!existing.numSocio && numSocio) existing.numSocio = numSocio;
      if (!existing.email && email) existing.email = email;
      if (!existing.telefono && telefono) existing.telefono = telefono;
    }

    const n = parseInt(numSocio, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
}

console.log('Unique valid socios to import:', dnis.size);
console.log('Max existing socio number:', maxNum);

const sinNumero = Array.from(dnis.values()).filter(s => !s.numSocio);
console.log('Socios without assigned number in CSV:', sinNumero.length);
sinNumero.forEach(s => console.log(`  - ${s.nombre} ${s.apellido} (DNI ${s.dni})`));