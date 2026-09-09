# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Socios / Comensales**: Clientes del Wine Bistro que acumulan puntos en cada visita, canjean premios (vinos, platos seleccionados, postres) mediante cupones QR temporales y responden encuestas de satisfacción.
- **Mozos / Personal de Salón**: Operan con tablets táctiles en el salón del restaurante para imputar tickets de mesa, comensales y asociar o registrar nuevos socios al instante, además de validar cupones de canje.
- **Administración / Gerencia**: Supervisa la nómina de socios, audita movimientos de puntos, gestiona el catálogo de premios, platos y visitas gastronómicas, y ajusta las reglas comerciales del restaurante.

## Product Purpose
Sistema integral de membresía, fidelización y seguimiento gastronómico de **La Encontrada - WINE BISTRO -**, diseñado para crear una experiencia de lealtad premium, intuitiva y veloz tanto para el cliente como para el equipo de salón.

## Positioning
Un programa de membresía gastronómica exclusivo para un Wine Bistro: sin contraseñas engorrosas para el cliente (login directo por DNI), distribución equitativa de puntos por comensal en mesa, canjes QR transparentes y control gerencial riguroso.

## Operating Context
- **Salón en servicio nocturno**: Ambiente con iluminación tenue de vinoteca / bistró; la interfaz debe ofrecer un contraste impecable, negros puros y tonos vino que no encandilen pero sean 100% legibles a distancia de brazo.
- **Móvil del socio**: Comensales que consultan su tarjeta virtual en la mesa, ven su saldo de puntos, exploran la carta de premios y presentan su QR al mozo.
- **Terminal de mesa (/pos)**: Pantalla táctil de mozo con botones amplios, confirmaciones inequívocas y flujo de alta rápida en menos de 10 segundos.

## Capabilities and Constraints
- **Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Prisma 6, PostgreSQL en Supabase.
- **Motor de puntos**: División equitativa de ticket por comensal (`puntos = floor((totalTicket / comensales) / pesosPorPunto)`).
- **Seguridad**: Aislamiento estricto de roles (Mozo solo accede a `/pos`; Gerencia accede a `/admin`).
- **Padrón real**: 286 socios activos integrados.

## Brand Commitments
- **Nombre**: La Encontrada - WINE BISTRO -
- **Paleta oficial**:
  - Color primario: `#5c131d` (Vino profundo / Borgoña / Tinto Reserva)
  - Fondo y superficies: `#010101` (Negro absoluto bistró)
  - Acentos y contrastes: Blanco `#ffffff`, Marfil champaña `#f5ede6`, tonos vino aterciopelados y detalles dorados sutiles para los puntos.
- **Logotipo oficial**: Isotipo de copa de vino fusionada con gorro de chef y remolino vinícola (`public/logo.png`).

## Product Principles
1. **Atmósfera de Wine Bistro**: Identidad envolvente, distinguida y sobria; rechazo absoluto a los clichés de software genérico (fondos grisáceos fríos, azules de corporativo tech o degradados estridentes).
2. **Eficiencia en Salón**: Cero fricción operativa; el mozo no debe dudar ni esperar.
3. **Recompensa Tangible**: El socio siente el valor de su fidelidad desde el primer vistazo a su tarjeta virtual.
