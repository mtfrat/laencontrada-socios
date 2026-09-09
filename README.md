# La Encontrada - Sistema de Fidelización, Socios y Hábitos Gastronómicos

Plataforma integral de fidelización de comensales, gestión de socios, acumulación de puntos por consumo en mesa, canje de premios mediante cupones QR, ranking y seguimiento de hábitos gastronómicos para el restaurante **La Encontrada**.

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
