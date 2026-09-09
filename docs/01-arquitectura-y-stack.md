# 01 - Arquitectura del Sistema y Stack Tecnológico

## 1. Visión General
El sistema **La Encontrada Socios** está concebido como una plataforma unificada y desacoplada mediante roles, accesible desde cualquier dispositivo sin requerir instalaciones nativas en tiendas de aplicaciones (App Store / Play Store).

Se implementa bajo el modelo **PWA (Progressive Web App)** para socios comensales y **Web Application** de alta disponibilidad para el personal del restaurante.

---

## 2. Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Framework Full-Stack** | Next.js 14+ (App Router) | Servidor y cliente unificados en React 19 / TypeScript. Server Actions para mutaciones seguras y API Routes ultrarrápidas. |
| **Lenguaje** | TypeScript | Tipado estático estricto en modelos de base de datos, DTOs y componentes UI. |
| **Estilos y Diseño UI** | Tailwind CSS + Lucide Icons | Diseño responsive mobile-first, estilos consistentes, rápida iteración y carga liviana para conexiones móviles en salón. |
| **Base de Datos** | PostgreSQL | Base de datos relacional robusta, con soporte nativo de transacciones ACID para evitar inconsistencias en saldos de puntos. |
| **ORM** | Prisma ORM | Tipado automático generado a partir del esquema (`schema.prisma`), migraciones seguras y consultas intuitivas. |
| **Autenticación** | NextAuth.js / Sesiones JWT cifradas | Manejo de sesiones para personal (contraseña hash con bcrypt) y acceso ágil para socios (token de sesión basado en DNI). |
| **Gestión de Archivos** | Almacenamiento local / S3 compatible / Cloudinary | Subida de fotos de premios y fotografías de tickets/comandas para el historial de visitas. |

---

## 3. Estructura de Proyecto Prevista

```
laEncontradaSocios/
├── docs/                      # Documentación modular del sistema (este repositorio de docs)
├── prisma/
│   ├── schema.prisma          # Definición de tablas, relaciones e índices
│   ├── migrations/            # Historial de migraciones SQL
│   └── seed.ts                # Semilla de datos iniciales y configuración por defecto
├── public/
│   ├── icons/                 # Iconos PWA y favicons
│   └── uploads/               # Directorio local de imágenes (premios, tickets)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Rutas de login (socios por DNI y personal por credenciales)
│   │   ├── (socio)/           # Portal del socio (dashboard, catálogo, ranking, historial)
│   │   ├── (pos)/             # Terminal ágil para mozos y cajeros (mesas y canjes QR)
│   │   ├── (admin)/           # Back office gerencial (socios, premios, reglas, reportes)
│   │   └── api/               # Endpoints REST / Webhooks / Exportaciones
│   ├── components/
│   │   ├── ui/                # Botones, modales, tablas, tarjetas, alertas
│   │   ├── socio/             # Componentes específicos de vista de cliente
│   │   ├── pos/               # Teclado numérico, escáner QR, selector de mesa
│   │   └── admin/             # Gráficos, formularios ABM, importadores
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Utilidades de sesión y hashing
│   │   ├── points-engine.ts   # Motor matemático de cálculo y división de puntos
│   │   └── qr.ts              # Generación y validación de tokens QR firmados
│   └── types/                 # Definiciones de TypeScript compartidas
├── .env.example               # Variables de entorno requeridas
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Estrategia de Despliegue y Ambientes
- **Local/Desarrollo:** Node.js con contenedor Docker o PostgreSQL local.
- **Producción:** Despliegue en plataforma Node (Vercel, Railway o VPS dedicado con PM2 y Nginx) conectado a base de datos PostgreSQL gestionada.
