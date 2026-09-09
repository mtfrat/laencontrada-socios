# 03 - Motor de Puntos, Mesas y Reglas de Cálculo

## 1. Filosofía del Sistema de Puntos
El motor de puntos premia el consumo real de los clientes en el restaurante La Encontrada de manera directa y sin complejidades:
- El mozo ingresa el **total gastado en la mesa** y la **cantidad de comensales sentados**.
- El sistema calcula el **gasto promedio por persona** dividiendo el total por los comensales.
- A cada socio presente en la mesa se le acreditan los puntos calculados en base a ese promedio.

---

## 2. Regla Fundamental: Consumo en Mesa y División Equitativa

### 2.1. Parámetros de Entrada
Al cobrar una mesa, el mozo/cajero ingresa:
1. **Monto total del ticket ($M):** Total facturado (ej: $100.000).
2. **Cantidad de comensales ($C):** Cantidad de personas sentadas (ej: 4).
3. **Socios presentes:** Lista de DNIs de los socios que formaban parte de la mesa.

### 2.2. Fórmula de Cálculo
Sea $R$ la tasa de conversión configurada en el Back Office (por ejemplo, \$1.000 = 1 punto):

$$\text{Gasto Promedio por Persona} = \frac{M}{C}$$

$$\text{Puntos por Socio} = \left\lfloor \frac{\text{Gasto Promedio por Persona}}{R} \right\rfloor$$

### 2.3. Ejemplo
- **Monto del ticket:** \$100.000
- **Comensales:** 4 personas
- **Ratio configurado:** \$1.000 = 1 punto ($R = 1.000$).
- **Gasto promedio por persona:** $\$100.000 / 4 = \$25.000$.
- **Puntos:** $\$25.000 / 1.000 = 25$ puntos para cada socio seleccionado.

---

## 3. Bonificación por Encuesta (Opcional)
Si un socio responde una breve encuesta de calidad posterior a su consumo, el sistema puede otorgar un bono fijo (ej. 10 puntos).

---

## 4. Auditoría e Inmutabilidad
Cada acreditación genera un registro inmutable en `TransaccionPuntos` y una visita en `VisitaConsumo`, garantizando trazabilidad y transparencia.
