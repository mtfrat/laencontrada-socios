---
name: La Encontrada Wine Bistro Design System
description: Visual design system for La Encontrada Wine Bistro loyalty and salon operations. Pure deep black canvas, velvet burgundy wine tones, crisp white typography, and warm champagne highlights.

colors:
  # Brand Anchors
  wine-primary: "#5c131d"         # Official brand wine / malbec
  wine-rich: "#7a1a27"            # Hover lift on wine CTAs
  wine-deep: "#3a0b12"            # Subtle wine-tinted card depths
  wine-glow: "rgba(92, 19, 29, 0.25)"  # Focus rings and delicate atmospheric glows
  wine-border: "rgba(92, 19, 29, 0.35)" # Default card and container borders

  # Surfaces
  canvas-black: "#010101"         # Page background (true bistró black)
  surface-card: "#0d0708"         # Elevated cards and containers (tinted dark)
  surface-elevated: "#150c0e"     # Modals, tooltips, active rows
  surface-inset: "#050304"        # Input fields, sunken counters

  # Text & Contrast
  text-white: "#ffffff"           # High-contrast headlines and active labels
  text-champagne: "#f5ede6"       # Warm ivory body and secondary headings
  text-muted: "#a1908d"           # Helper text, timestamps, captions
  text-faint: "#635553"           # Disabled states and placeholder text

  # Accents & Functional
  gold-points: "#d4aa58"          # Member points, trophy badges, VIP levels
  gold-glow: "rgba(212, 170, 88, 0.15)"
  status-success: "#2e7d4a"       # Confirmation states, valid QR vouchers
  status-error: "#8a1c22"         # Form errors, expired coupons

typography:
  headings: "font-serif, Georgia, serif"
  body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  numbers: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

radii:
  card: "1.25rem"   # 20px
  button: "1rem"    # 16px
  chip: "9999px"    # Pill
---

# La Encontrada - WINE BISTRO - Design System

Este documento define las directrices visuales e identitarias para el sistema de fidelización de **La Encontrada**.

## Atmósfera y Dirección Visual
- **Tono**: Wine Bistro contemporáneo, nocturno, cálido y refinado.
- **Canvas**: Fondo `#010101` absoluto. La iluminación de la interfaz emana de los ricos tonos bordó (`#5c131d`), marfiles cálidos y dorados champaña sutiles.
- **Logotipo**: Incorporación destacada del imagotipo oficial de la copa con gorro de chef y el remolino de vino tinto.
- **Regla Impeccable**: Sin bordes estridentes ni degradados genéricos de SaaS. La profundidad se logra mediante superficies oscuras tintadas y bordes delicados con alpha de vino (`border-[#5c131d]/30`).
