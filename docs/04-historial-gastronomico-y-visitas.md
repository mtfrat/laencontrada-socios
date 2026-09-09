# 04 - Historial Gastronómico, Visitas y Comprobantes

## 1. Objetivo del Módulo
Más allá del saldo de puntos, el restaurante necesita conocer los hábitos de consumo de sus clientes más fieles:
- ¿Vienen a almorzar los días de semana o cenan los fines de semana?
- ¿Cuál es su ticket promedio histórico individual?
- ¿Qué cortes de carne, vinos o platos específicos prefieren?
- ¿Existe un comprobante fiscal o comanda asociada para verificación interna?

---

## 2. Flujo Operativo en "Dos Tiempos"
Para no entorpecer el ritmo vertiginoso del salón durante las horas pico, la captura de datos se divide en dos fases:

```
[TIEMPO 1: En Salón / Mesa]
   Mozo ingresa Ticket Total + Comensales + DNIs de Socios.
   => Puntos acreditados al instante en el celular del socio.
   => Se crea el registro base de `VisitaConsumo`.

             │ (Posteriormente: cierre de turno, tiempo libre o administración)
             ▼
[TIEMPO 2: En Back Office o Terminal de Caja]
   Personal abre el listado de visitas del día/turno.
   => Puede ajustar el horario/turno puntual de la visita.
   => Carga los platos consumidos (búsqueda rápida o texto libre).
   => Adjunta fotografía del ticket o ingresa número fiscal de factura.
```

---

## 3. Detalle de Datos de la Visita

### 3.1. Franja Horaria y Fecha
- **Fecha y hora de visita:** Por defecto, la hora en que se registró la mesa, con posibilidad de edición manual en caso de carga diferida.
- **Turno:** Clasificación automática o manual (`ALMUERZO`, `CENA`, `AFTER/TARDE`).

### 3.2. Métricas Económicas de la Visita
- **Monto total de la comanda:** Ej. \$80.000
- **Comensales:** 2 personas
- **Gasto promedio por persona:** \$40.000 (calculado automáticamente)

### 3.3. Platos Consumidos (`ItemPlatoConsumido`)
- Carga ágil de platos:
  - Selector con autocompletado de platos frecuentes (ej: "Bife de chorizo 400g", "Provoleta clásica", "Vino Malbec Gran Reserva").
  - Opción de carga de texto libre para platos o sugerencias especiales del chef.
  - Cantidad y notas adicionales (ej: "Cocción bien cocido", "Para compartir").

### 3.4. Ticket o Comanda Adjunta (`TicketAdjunto`)
- **Fotografía de la comanda/ticket:** Permite tomar una foto con la cámara del celular o subir archivo de imagen (JPG/PNG).
- **Número de comprobante fiscal:** Campo alfanumérico para asociar con el sistema de facturación o punto de venta del restaurante.

---

## 4. Perfil Gastronómico 360° en la Ficha del Socio
Con esta información acumulada, la ficha del socio en el Back Office presenta:
1. **Frecuencia y Días Favoritos:** Gráfico de visitas por día de la semana y turno.
2. **Ticket Promedio Histórico:** Evolución del gasto individual por persona a lo largo de los meses.
3. **Top 5 Platos Favoritos:** Platos más pedidos históricamente por el socio.
4. **Línea de Tiempo de Visitas:** Registro cronológico con fotos de comprobantes y notas de mesa.
