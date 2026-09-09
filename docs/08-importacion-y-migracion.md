# 08 - Importación y Migración de la Base de Datos

## 1. Estrategia de Migración
El sistema contempla dos mecanismos complementarios para cargar e integrar la base de datos de socios existente del restaurante:
1. **Script de Ingesta Inicial (CLI / Seed):** Para procesar el archivo maestro original que compartirá el restaurante (ya sea Excel, CSV, JSON o volcado SQL).
2. **Módulo de Importación en el Back Office:** Interfaz gráfica accesible para el administrador para cargar o actualizar lotes de socios mediante archivos Excel (`.xlsx`) o `.csv`.

---

## 2. Estructura Estándar Esperada de Socios

Para garantizar una carga limpia y sin errores, el sistema mapea las siguientes columnas:

| Columna | Obligatorio | Tipo | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `dni` | Sí | Texto/Numérico | `34123456` | Clave principal de acceso para el socio. |
| `numeroSocio` | Opcional (se autogenera si falta) | Texto | `SOC-0104` | Número identificatorio del carnet o sistema previo. |
| `nombre` | Sí | Texto | `Martín` | Nombre del cliente. |
| `apellido` | Opcional | Texto | `Gómez` | Apellido del cliente. |
| `telefono` | Opcional | Texto | `1154321098` | Número de WhatsApp o teléfono móvil. |
| `email` | Opcional | Texto | `martin@correo.com` | Email para comunicaciones. |
| `puntosActuales` | Opcional (Default: 0) | Entero | `150` | Saldo disponible de puntos acumulados previamente. |
| `puntosHistoricos`| Opcional (Default: puntosActuales)| Entero | `350` | Puntos acumulados en la historia del cliente para ranking. |

---

## 3. Reglas de Validación y Sanitización
Durante el proceso de importación:
1. **Normalización de DNI:** Se eliminan puntos, espacios o guiones (ej. `34.123.456` $\rightarrow$ `34123456`).
2. **Resolución de Duplicados (Upsert):**
   - Si el DNI ya existe en la base: se actualizan sus datos y se le puede sumar o reemplazar el saldo según opción seleccionada.
   - Si el DNI no existe: se crea un nuevo socio con su correspondiente fecha de alta.
3. **Registro de Transacción Inicial:**
   - Si se importan socios con saldo de puntos mayor a 0, se genera automáticamente una entrada en `TransaccionPuntos` con tipo `AJUSTE_MANUAL` y motivo *"Saldo migrado desde base de datos anterior"* para asegurar la consistencia del libro mayor.

---

## 4. Funcionalidad de Exportación
El Back Office también incluye un botón de **"Exportar Socios a Excel (.xlsx)"**, permitiendo al restaurante descargar en cualquier momento la base de datos completa con sus puntos vigentes, historial y fechas de última visita.
