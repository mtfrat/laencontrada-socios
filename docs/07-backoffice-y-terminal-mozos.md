# 07 - Back Office Administrativo y Terminal de Mozos

## 1. Perfiles de Usuario y Roles

| Rol | Acceso | Responsabilidades |
| :--- | :--- | :--- |
| **MOZO** | Terminal de Salón (`/pos`) | Carga ágil de consumo en mesas, búsqueda de socios por DNI, escaneo y validación de cupones QR de canje. |
| **CAJERO** | Terminal de Salón + Cierre (`/pos`, `/visitas`) | Carga de mesas, validación de canjes, carga diferida de tickets fiscales y platos consumidos durante el turno. |
| **ADMIN** | Acceso Total (`/admin`, `/pos`) | Tableros gerenciales, ABM de socios, ABM de premios, ajustes manuales de puntos, configuración de reglas, importador masivo y gestión de usuarios. |

---

## 2. Terminal de Mozos y Cajeros (`/pos`)
Diseñada con botones táctiles grandes y optimizada para agilidad extrema:
1. **Pestaña 1: Cargar Mesa / Puntos**
   - Campo grande para ingresar el total del ticket (ej: `$85.000`).
   - Selector numérico de cantidad de comensales (ej: `4 personas`).
   - Buscador rápido de socios por DNI o Nro. de Socio:
     - Permite agregar 1, 2 o más socios presentes en la mesa.
   - Resumen visual en vivo: *"Gasto por persona: $21.250 -> 21 puntos para cada socio"*.
   - Botón destacado de confirmación: *"Acreditar Puntos"*.
2. **Pestaña 2: Validar Canje QR**
   - Visor de cámara activo para escanear el QR del socio.
   - Campo alternativo de entrada manual de código.
   - Confirmación visual inmediata (muestra foto del premio, nombre del socio y botón de entrega).

---

## 3. Back Office Administrativo (`/admin`)

### 3.1. Dashboard Principal
- Tarjetas KPI:
  - Total de puntos emitidos vs canjeados.
  - Cantidad de socios activos en el mes.
  - Ticket promedio general del restaurante.
  - Premios más canjeados.
- Gráfico de evolución de puntos y visitas en los últimos 30 días.

### 3.2. Gestión de Socios
- Tabla de socios con filtros por DNI, Nombre, Rango de Puntos y Estado.
- Ficha individual de socio con:
  - Datos de contacto.
  - Saldo actual y puntos históricos.
  - Historial completo de visitas, consumos y platos preferidos.
  - Botón de **"Ajuste Manual de Puntos"** (+/- puntos) con justificación obligatoria.

### 3.3. Gestión de Premios (CRUD)
- Formulario de alta y edición:
  - Título y descripción.
  - Costo en puntos.
  - Selector/subida de imagen del premio.
  - Control de stock disponible (o casilla "Stock ilimitado").
  - Switch de activación/pausa del premio.

### 3.4. Configuración del Motor de Puntos
- Campo editable para el ratio: *"$ [1000] pesos = 1 punto"*.
- Bono por referido: *"[5] puntos por comensal invitado"*.
- Bono por encuesta completada: *"[10] puntos"*.
- Tiempo de validez de QR de canje: *"[15] minutos"*.

### 3.5. Gestión de Personal
- Listado de usuarios del restaurante con asignación de roles y contraseñas.
