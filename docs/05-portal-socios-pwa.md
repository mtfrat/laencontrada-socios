# 05 - Portal de Socios (Web App PWA Mobile-First)

## 1. Experiencia de Usuario (UX)
El portal de socios está optimizado para dispositivos móviles, diseñado para ser accesible en segundos mientras el comensal está en el restaurante (por ejemplo, escaneando un código QR colocado en la mesa o accediendo al enlace web del restaurante).

---

## 2. Flujo de Autenticación Ágil (Sin Fricción)
1. El socio ingresa al portal (`/login`).
2. Se le solicita únicamente su **Número de DNI**.
3. **Validación:**
   - Si el DNI existe en la base de datos de socios, se inicia sesión inmediatamente mediante token seguro en cookie `HttpOnly`.
   - (Opcional configurable): Posibilidad de solicitar un PIN de 4 dígitos o permitir definir una contraseña si el socio desea mayor privacidad.
4. Si el DNI no está registrado, se le muestra la opción de solicitar alta o consultar al mozo.

---

## 3. Pantallas Principales del Portal

### 3.1. Inicio / Mi Tarjeta Virtual (`/dashboard`)
- **Tarjeta de Socio Digital:**
  - Nombre completo del socio y Número de Socio.
  - Saldo de Puntos Disponibles en tipografía destacada.
  - Puntos Históricos acumulados y categoría/nivel alcanzado.
- **Acciones Rápidas:**
  - Botón "Ver Catálogo de Premios".
  - Botón "Ver Ranking".
  - Botón "Responder Encuesta de Visita" (si tiene una visita reciente sin evaluar).

### 3.2. Historial de Actividad (`/historial`)
- Listado cronológico de:
  - Puntos ganados por consumo (con detalle de fecha, comensales y puntos).
  - Puntos por encuestas o promociones.
  - Canjes realizados y estado del canje.

### 3.3. Catálogo de Premios y Canje (`/premios`)
- Tarjetas visuales de cada premio:
  - Fotografía en alta calidad.
  - Título y descripción de la recompensa.
  - Costo en puntos.
  - Indicador dinámico: *"¡Te faltan 15 puntos!"* o botón verde *"Canjear"*.
- **Acción de Canje:**
  - Al pulsar "Canjear", se abre un modal de confirmación indicando el saldo restante.
  - Al confirmar, se genera la pantalla del **Cupón QR Temporal** con temporizador regresivo de 15 minutos para mostrar al personal.

### 3.4. Tabla de Líderes / Ranking (`/ranking`)
- **Gamificación y Reconocimiento:**
  - Podio (Puestos 1, 2 y 3) con medallas/iconos distintivos.
  - Tabla Top 20 de socios con mayor puntaje histórico.
  - **Cuidado de la Privacidad:** Visualización con formato Nombre + Inicial de Apellido (ej. *"Carlos M."*, *"Lucía R."*).
  - Fila destacada con la **posición actual del socio conectado** (ej. *"Tu puesto actual: #12"*).

### 3.5. Encuesta de Calidad (`/encuesta/:visitaId`)
- Valoración de 1 a 5 estrellas en:
  - Calidad de los platos.
  - Atención del personal y velocidad.
  - Ambiente y confort.
- Campo de comentarios opcionales.
- Al enviar: Acreditación inmediata del bono de puntos con notificación emergente de celebración.
