---
name: La Encontrada Wine Bistro
description: Editorial ivory and wine interfaces for members and staff, with a distinct photographic restaurant experience.
colors:
  brand-wine: "#5c131d"
  paper: "#f5f0e7"
  surface: "#fffaf3"
  surface-soft: "#e9dfd1"
  ink: "#352b2b"
  muted: "#725f55"
  wine: "#54262d"
  wine-hover: "#713843"
  line: "#d7c9bb"
  on-wine: "#fff9f0"
  points: "#f4d8b6"
  night-paper: "#211b17"
  night-ink: "#f5eee3"
  night-accent: "#e1bd98"
  bistro-black: "#010101"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(54px, 6vw, 86px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "13px"
rounded:
  square: "0px"
  card: "8px"
spacing:
  tap-target: "44px"
  member-gutter: "28px"
  member-gutter-mobile: "18px"
components:
  member-button-primary:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.on-wine}"
    rounded: "{rounded.square}"
    height: "57px"
    padding: "13px 20px"
  member-button-primary-hover:
    backgroundColor: "{colors.wine-hover}"
  member-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  member-balance:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.on-wine}"
    rounded: "{rounded.square}"
  member-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    height: "64px"
---

# Design System: La Encontrada Wine Bistro

## Overview

**Creative North Star: "La mesa en papel y vino"**

La Encontrada mantiene la identidad del vino y la experiencia real del restaurante en todas sus superficies. El club de socios y las pantallas de administración y salón usan papel marfil, tinta oscura y paneles bordó para que los datos y las acciones se lean con claridad. La portada del restaurante puede usar la versión luminosa o la versión Noche, con sus reglas fotográficas propias; las propuestas se detallan en `docs/DESIGN-proposals.md`.

El logotipo oficial de la copa, gorro de chef y remolino (`public/logo.png`) es el ancla de marca. La composición editorial, el serif expresivo y las fotos reales del salón conectan el programa con el bistró. Los controles operativos conservan lectura rápida y objetivos táctiles amplios.

**Key Characteristics:**

- Marfil cálido para las pantallas de socios y personal; bordó reservado para saldo y acciones principales.
- Cormorant Garamond para encabezados; Arial para lectura y operación.
- Fotografías reales del restaurante, líneas finas y superficies planas.
- Contraste visible y objetivos táctiles de al menos `44px`.

## Colors

### Primary

- **Vino de marca** (`brand-wine`): color oficial del Wine Bistro y referencia de identidad; permanece disponible en el sistema y en las utilidades heredadas.
- **Vino editorial** (`wine`): titulares y botones de Marfil, panel de saldo, acciones y foco en el club. `wine-hover` marca la respuesta al cursor. `on-wine` sostiene la lectura sobre esos paneles.

### Secondary

- **Champaña de puntos** (`points`): cifra de saldo sobre vino. En la portada Noche, `night-accent` identifica la acción de reserva y responde a otra superficie, sin trasladarse a los controles del club.

### Neutral

- **Papel** (`paper`): canvas de socios, administración, POS y portada Marfil. **Tarjeta** (`surface`) y **papel sombreado** (`surface-soft`) ordenan planos secundarios.
- **Tinta** (`ink`) y **tinta tenue** (`muted`): lectura principal y secundaria. **Línea cálida** (`line`) separa filas, campos y regiones sin cajas pesadas.
- **Sala nocturna** (`night-paper`) y **crema nocturna** (`night-ink`): pareja de contraste exclusiva de la portada Noche. `bistro-black` conserva el negro de la identidad histórica y de las utilidades heredadas; no define el canvas actual del club.

**The Surface Context Rule.** Socios y personal se leen sobre papel; la portada Noche usa su propia pareja oscura. No se mezclan las reglas de contraste entre ambas.

## Typography

**Display Font:** Cormorant Garamond, con Georgia como alternativa. **Body Font:** Arial, con Helvetica como alternativa.

**Character:** El serif da una voz gastronómica y editorial a saludos, cifras y títulos; el sans serif sostiene información, navegación y acciones concretas.

### Hierarchy

- **Display** (`display`): saludo del panel e ingreso del socio; la escala responde al ancho de la pantalla.
- **Headline** (`headline`): secciones del panel y encabezados de tarjetas.
- **Body** (`body`): explicaciones, movimientos, formularios y datos operativos.
- **Label** (`label`): navegación, metadatos, estados y acciones compactas. La firma secundaria de la marca usa mayúsculas espaciadas.

**The Serif for Meaning Rule.** Los títulos y la cifra de puntos llevan la voz editorial; controles y datos transaccionales conservan la lectura directa del sans serif.

## Layout

El panel del socio tiene un ancho máximo de `1180px` y un margen lateral de `28px`, que baja a `18px` a `640px`. En escritorio, la columna de saldo y acciones ocupa más espacio que la foto y la invitación lateral. A `900px` la retícula se apila; a `640px` se simplifican cabecera y espaciados; por debajo de `370px` las dos acciones pasan a una columna. Ingreso combina foto y formulario en escritorio y los apila en móvil. La navegación del club queda fija abajo con cuatro destinos y espacio suficiente en el contenido para no tapar el final.

Las listas de premios, historial y ranking usan contenido de hasta `1050px`; los flujos de cupón y encuesta se limitan a `660px`. Premios muestra dos columnas en escritorio y una en móvil. Administración y POS comparten la base marfil; los botones y campos operativos tienen al menos `44px` de alto. La portada y sus variantes conservan su propia composición fotográfica, descrita en `docs/DESIGN-proposals.md`.

## Elevation & Depth

El club y las pantallas de personal son mayormente planos: el contraste entre papel, tarjeta, vino y líneas finas crea jerarquía. Las tarjetas de premios anulan las sombras heredadas; la navegación fija del socio usa una sombra superior tenue (`0 -6px 24px rgba(84,38,45,.08)`) para distinguirse del contenido desplazable. La foto del salón da profundidad visual sin convertir las tarjetas en objetos flotantes.

**The Flat Card Rule.** En las listas de socios, premios y operaciones, las superficies cambian de tono o borde antes de recurrir a una sombra.

## Shapes

Botones, campos y panel de saldo son rectangulares. Las tarjetas heredadas de premios y flujos usan un redondeo discreto (`8px`). Los bordes cálidos separan contenido; la imagen y el logotipo conservan su encuadre propio. No se transforma el contenido operativo en grandes cápsulas decorativas.

## Components

### Buttons

La acción principal usa fondo `wine`, texto `on-wine`, esquina recta y cambio a `wine-hover`. El botón de ingreso mide al menos `57px` de alto; las acciones táctiles del club y del personal, al menos `44px`. Los enlaces secundarios se reconocen por texto y línea inferior o por una flecha. El foco usa contorno de vino de `2px` con separación de `4px` en el panel.

### Cards / Containers

El saldo es un panel de vino con cifra champaña, datos del socio y regla interna sutil. Las acciones de premio y visitas forman un par de bloques, uno lleno y otro de tarjeta clara con borde. Las tarjetas de premio son claras, de borde cálido y esquinas de `8px`; el borde cambia en hover. Las filas de actividad se separan con reglas finas.

### Inputs / Fields

Los campos claros tienen borde cálido y texto de tinta. El DNI de ingreso tiene `64px` de alto, cifras amplias y esquinas rectas. Los campos de administración y POS mantienen un mínimo de `44px`. El foco visible usa vino; los errores se muestran con texto y superficie rojiza clara, acompañados de una instrucción útil.

### Navigation

La cabecera del club mantiene logotipo, nombre y salida; el número de socio se oculta en el ancho móvil. La navegación inferior fija muestra Inicio, Canjes, Visitas y Ranking, con el destino activo sobre `surface-soft`. La portada tiene navegación propia y menú móvil; administración y POS conservan prioridades operativas.

### Restaurant photography

La foto real del salón acompaña el panel e ingreso; la portada utiliza escenas reales de cocina, lugar y ambiente. La procedencia de las imágenes de restaurante está en `docs/restaurant-photo-sources.json`.

## Do's and Don'ts

### Do:

- **Do** mantener el logotipo oficial y la relación marfil, vino y fotografía real en el club.
- **Do** asegurar foco visible y objetivos de al menos `44px` en navegación y controles.
- **Do** dejar que el saldo, el premio y la visita se entiendan desde la primera pantalla móvil.

### Don't:

- **Don't** volver al canvas negro en las pantallas actuales de socios; el negro sigue siendo un ancla de marca y una referencia heredada.
- **Don't** llevar la paleta de Noche a formularios operativos sin conservar su contraste propio.
- **Don't** usar azules corporativos, grises fríos o degradados estridentes que desplacen la identidad del bistró.
