# La Encontrada - Sistema de Fidelización, Socios y Hábitos Gastronómicos

Plataforma integral de fidelización de comensales, gestión de socios, acumulación de puntos por consumo en mesa, canje de premios mediante cupones QR, ranking y seguimiento de hábitos gastronómicos para el restaurante **La Encontrada**.

Para ejecutar `npm run db:seed`, configurá `SEED_ADMIN_PASSWORD` y `SEED_MOZO_PASSWORD` con valores propios de al menos 12 caracteres. El seed conserva usuarios existentes y solo crea las cuentas faltantes. Los premios y el socio ficticios se cargan únicamente con `SEED_DEMO_DATA=true` en un entorno de pruebas; nunca actives esa opción en la base real.

## Acceso del equipo y puntos

- Administrador (`SUPER_ADMIN`): gestiona las cuentas del equipo en `/admin/usuarios`, los productos canjeables y la configuración.
- Equipo (`EQUIPO`): accede a `/pos` para cargar puntos desde una mesa/ticket y validar canjes.
- Todo el personal activo puede usar el chat grupal privado en `/staff/chat`. Los socios no tienen acceso.
- El administrador crea cuentas de equipo con email y contraseña (mínimo 12 caracteres). El usuario interno se genera automáticamente. Se puede iniciar sesión con email o usuario.
- Las migraciones convierten los `ADMIN` anteriores en Administrador y las cuentas de salón anteriores en Equipo. Aplicar con `npx prisma migrate deploy` en otra base.
- Los productos canjeables admiten una imagen JPG, PNG o WebP de hasta 2 MB, guardada en PostgreSQL, además de descripción y puntos requeridos.
- La carga de puntos exige al menos un punto por socio con la regla vigente y rechaza mesas con socios repetidos, inexistentes o inactivos sin cambiar saldos.
- Cada carga manual exige el número fiscal de factura. La base impide acreditar la misma factura dos veces, incluso si aparece luego en un cierre PDF de MaxiRest.
- Los socios ingresan con el DNI como usuario y contraseña. El administrador y el equipo conservan sus propias contraseñas. Usar un dato conocido como contraseña ofrece protección limitada; el ingreso tiene límites de intentos por IP y DNI.
- Al terminar el turno, el equipo puede subir el PDF de MaxiRest en `/pos` → **Cierre PDF**, indicar los comensales y los números de socio de cada factura, revisar nombres y puntos, y confirmar la acreditación. Subir o previsualizar el archivo no modifica saldos.
- La equivalencia pesos/punto se configura en `/admin/configuracion`; los premios, imágenes y puntos requeridos se editan en `/admin/premios`.
- Los límites de intentos de acceso del equipo y de socios se guardan en PostgreSQL y se comparten entre las instancias de Vercel. Las claves almacenadas son HMAC, sin IP ni nombre de usuario en claro.

## Puesta en producción en Vercel

El proyecto de Vercel existente se llama `laencontrada-socios`. Configurá `DATABASE_URL`, `DATABASE_CONNECTION_LIMIT`, `SESSION_SECRET` y `NEXT_PUBLIC_APP_URL` para el entorno de producción. Usá una clave de sesión de al menos 32 caracteres. Nunca configures `LOCAL_REVIEW=true` ni `SEED_DEMO_DATA=true` en producción.

1. En una base nueva, aplicá las migraciones con `npx prisma migrate deploy` después de revisar una copia de seguridad. En la base Supabase conectada durante esta revisión ya están aplicadas y `prisma migrate status` quedó al día. Las migraciones registran facturas únicas y versiones de sesión.
2. Desplegá por HTTPS y probá el acceso de un socio de prueba, una factura manual repetida, el cierre PDF de MaxiRest y el QR desde el Android del salón. La cámara requiere permiso del navegador y HTTPS en el dominio publicado.

El PDF `FINTURNO.PDF` provisto para la revisión se probó en desarrollo y con el servidor compilado: tres facturas, total de $124.950 y bloqueo de una factura ya acreditada. La lectura en Next requiere `serverExternalPackages: ['pdfjs-dist']` para cargar el worker del lector PDF. La cámara del Android aún necesita una prueba en el dispositivo físico con el dominio HTTPS definitivo.

La migración del limitador compartido también se aplicó a Supabase; las nueve migraciones estaban al día en la última revisión. Falta probar el QR con la cámara del Android físico y verificar el despliegue publicado.

---

## 📚 Documentación Técnica y Funcional (Sprint 0)

Toda la especificación del sistema se encuentra organizada y detallada en la carpeta [`/docs`](docs/):

1. **[01. Arquitectura y Stack Tecnológico](docs/01-arquitectura-y-stack.md)**: Next.js, React, Tailwind CSS, TypeScript, Prisma, PostgreSQL y arquitectura de carpetas.
2. **[02. Modelo de Datos y Esquema Prisma](docs/02-modelo-de-datos.md)**: Diagrama Entidad-Relación, tablas, campos, tipos y relaciones.
3. **[03. Motor de Puntos y Mesas](docs/03-motor-de-puntos-y-mesas.md)**: Algoritmo de división equitativa de consumos, reglas de conversión y bonos.
4. **[04. Historial Gastronómico y Visitas](docs/04-historial-gastronomico-y-visitas.md)**: Carga en dos tiempos (tiempo real en mesa vs diferida en caja), platos consumidos y comprobantes/tickets adjuntos.
5. **[05. Portal de Socios (PWA Mobile-First)](docs/05-portal-socios-pwa.md)**: Acceso ágil con DNI, tarjeta virtual, historial, ranking y encuestas.
6. **[06. Premios y Canjes con Código QR](docs/06-premios-y-canjes-qr.md)**: Ciclo de vida del canje, cupón temporal de 15 minutos y validación en salón.
7. **[07. Back Office y Terminal de Mozos](docs/07-backoffice-y-terminal-mozos.md)**: Terminal táctil POS para mozos/cajeros y panel administrativo de control.
8. **[08. Importación y Migración de Datos](docs/08-importacion-y-migracion.md)**: Especificación de carga de base de datos actual y módulo Excel/CSV.
9. **[09. Roadmap de Sprints y Criterios de Aceptación](docs/09-roadmap-sprints.md)**: Plan de desarrollo modular dividido en Sprints y Sub-sprints.

---

## 📌 Visión de Sprints

```
[Sprint 0: Documentación Modular de Especificación]  <-- ¡Completado!
       │
       ▼
[Sprint 1: Base del Proyecto, Base de Datos & Autenticación] <-- ¡Completado!
       │
       ▼
[Sprint 2: Motor de Puntos, Mesas y Terminal de Mozos] <-- ¡Completado!
       │
       ▼
[Sprint 3: Historial Gastronómico y Enriquecimiento de Visitas] <-- ¡Completado!
       │
       ▼
[Sprint 4: Portal del Socio (PWA) & Leaderboard] <-- ¡Completado!
       │
       ▼
[Sprint 5: Catálogo de Premios y Canje con Código QR]
       │
       ▼
[Sprint 6: Back Office Gerencial, Importador de Datos y Despliegue]
```
