# 09 - Roadmap de Sprints y Criterios de Aceptación

Este documento establece la descomposición del proyecto en Sprints e hitos incrementales para el desarrollo paso a paso del sistema de fidelización de La Encontrada.

---

## 🏁 Sprint 0: Especificación y Documentación de Arquitectura (Completado)
- **Objetivo:** Definir el alcance, arquitectura, modelos de datos, flujos de usuario y reglas de puntos en archivos Markdown independientes.
- **Entregables:**
  - `docs/01-arquitectura-y-stack.md`
  - `docs/02-modelo-de-datos.md`
  - `docs/03-motor-de-puntos-y-mesas.md`
  - `docs/04-historial-gastronomico-y-visitas.md`
  - `docs/05-portal-socios-pwa.md`
  - `docs/06-premios-y-canjes-qr.md`
  - `docs/07-backoffice-y-terminal-mozos.md`
  - `docs/08-importacion-y-migracion.md`
  - `docs/09-roadmap-sprints.md`

---

## 🚀 Sprint 1: Setup Base, Base de Datos & Autenticación (Completado)
- **Sub-sprint 1.1 (Completado):** Inicialización del proyecto Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons y estructura de directorios.
- **Sub-sprint 1.2:** Configuración de Prisma ORM, definición de modelos completos en `schema.prisma` y ejecución de migraciones iniciales.
- **Sub-sprint 1.3 (Completado):** Sistema de autenticación de personal (Admin/Mozo con credenciales) y acceso ágil para socios mediante DNI con cookies de sesión seguras.
- **Criterio de Aceptación:** Usuario admin y socio pueden iniciar sesión y ver sus respectivas pantallas de bienvenida.

---

## 💳 Sprint 2: Motor de Puntos y Terminal de Mozos (Completado)
- **Sub-sprint 2.1:** Implementación de la librería matemática de cálculo de puntos (`points-engine.ts`) con división equitativa por comensal.
- **Sub-sprint 2.2:** Interfaz táctil de salón (`/pos`) para mozos/cajeros: ingreso de monto de ticket, cantidad de comensales, búsqueda de socios por DNI y confirmación en 1 toque.
- **Sub-sprint 2.3:** Registro inmutable en `TransaccionPuntos` y actualización atómica del saldo de socios.
- **Criterio de Aceptación:** El mozo carga un ticket de $100.000 con 4 personas y 2 socios; ambos socios reciben sus 25 puntos inmediatamente.

---

## 🥩 Sprint 3: Historial Gastronómico y Enriquecimiento de Visitas (Completado)
- **Sub-sprint 3.1:** Creación del modelo `VisitaConsumo` con franja horaria, fecha y cálculo automático del ticket promedio individual.
- **Sub-sprint 3.2 (Completado):** Pantalla de enriquecimiento diferido (/admin/visitas) para detallar platos consumidos de forma manual o con sugerencias rápidas de salón.
- **Sub-sprint 3.3 (Completado):** Módulo para asociar número de comprobante/factura fiscal y foto/enlace del ticket físico.
- **Criterio de Aceptación:** En cualquier momento posterior se puede abrir una visita, asignarle los platos comidos y adjuntar la imagen del ticket fiscal.

---

## 📱 Sprint 4: Portal del Socio (PWA), Ranking & Encuestas Editables (Completado)
- **Sub-sprint 4.1 (Completado):** Dashboard mobile del socio con tarjeta virtual, número de socio, puntos vigentes y puntos históricos.
- **Sub-sprint 4.2 (Completado):** Vista de historial detallado (`/socio/historial`) con movimientos, platos consumidos y encuestas.
- **Sub-sprint 4.3 (Completado):** Leaderboard / Ranking gamificado (`/socio/ranking`) con podio top 3, nombres protegidos ("Juan P.") y posición destacada.
- **Sub-sprint 4.4 (Completado):** Encuesta de satisfacción 100% editable desde Back Office (`/admin/encuestas`), formulario con estrellas (`/socio/encuesta/[visitaId]`) y acreditación automática de puntos.
- **Criterio de Aceptación:** El socio consulta su tarjeta, ranking e historial en su teléfono, y califica su visita ganando puntos con preguntas configuradas dinámicamente por la administración.

---

## 🎁 Sprint 5: Catálogo de Premios y Canje con Códigos QR
- **Sub-sprint 5.1:** Catálogo visual de premios para socios con fotos, descripción y costo en puntos.
- **Sub-sprint 5.2:** Generación del cupón QR temporal con temporizador regresivo de 15 minutos y congelamiento de saldo.
- **Sub-sprint 5.3:** Escáner / validador de QR en la terminal del mozo/cajero con débito definitivo de puntos y descuento de stock.
- **Sub-sprint 5.4:** Manejo de expiraciones y reintegro automático de puntos.
- **Criterio de Aceptación:** Un socio canjea un postre, genera el QR en su teléfono, el mozo lo escanea desde su terminal y el premio queda entregado descontando los puntos.

---

## ⚙️ Sprint 6: Back Office Gerencial, Importador de Datos y Despliegue
- **Sub-sprint 6.1:** Módulo de importación y exportación masiva de socios vía Excel (.xlsx / .csv) con normalización de DNI.
- **Sub-sprint 6.2:** Script de ingesta para procesar la base de datos de clientes actual del restaurante.
- **Sub-sprint 6.3:** Panel de configuración de reglas (pesos por punto, bonos de encuesta y referidos).
- **Sub-sprint 6.4:** Dashboard con métricas de fidelización y control de usuarios.
- **Sub-sprint 6.5:** Pruebas integrales de extremo a extremo y preparación de entorno de producción.
- **Criterio de Aceptación:** Sistema completamente operativo con la base de socios cargada y listo para su uso en el salón y la administración.
