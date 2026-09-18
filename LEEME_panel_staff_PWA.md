# Panel del Staff FitKid · embed en Duda (vía n8n, sin host externo)

Panel guiado por botones con las 25 acciones del CRM. **Se sirve desde tu propio n8n**
(workflow `wf-staff-widget`) y se embebe en la página privada de Duda con un iframe.
Backend de acciones = router `wf-staff-acciones` (ya activo). Agente Gemini = "Modo libre".

## Estado actual (listo)
- Workflow **`wf-staff-widget · FitKid`** (id `mBEQzBxxRkeeldXm`) **ACTIVO**.
- URL del panel: **https://yoor32.app.n8n.cloud/webhook/fitkid-widget**
- Verificado: carga el panel completo y **se puede embeber en iframe** desde otro dominio
  (sin bloqueo X-Frame-Options/CSP). Mismo origen que el router → **cero CORS**.

## 1) Embeber en la página privada de Duda
1. En Duda, crea/usa una página dentro del **área de miembros** (detrás del login), p. ej. "Panel Staff".
2. Agrega un widget **HTML / Embed Code** y pega:

```html
<iframe
  src="https://yoor32.app.n8n.cloud/webhook/fitkid-widget"
  title="Panel del Staff FitKid"
  style="width:100%;min-height:760px;border:0;border-radius:16px"
  allow="camera; clipboard-write"></iframe>
```
3. Publica. Listo: el panel queda dentro del sitio, aislado del tema de Duda.

## 2) Modo libre (agente Gemini) — opcional
El panel ya apunta al router para las acciones. Para activar el botón "Modo libre":
en n8n abre `wf-asistente-staff` → Chat Trigger → hazlo público (Embedded/Hosted) → copia
la Chat URL. Luego dímela y actualizo el `CONFIG.CHAT_URL` dentro del workflow del widget
(o lo edito por ti).

## Mantenimiento del panel (cómo actualizar el HTML)
El HTML va embebido (base64) dentro del Code node del workflow `wf-staff-widget`. Cuando
cambiemos el diseño o agreguemos acciones, regenero ese workflow con el nuevo HTML. Tú no
tienes que tocar nada en Duda: el iframe siempre apunta a la misma URL.

## Seguridad
- La página vive detrás del **login de miembros de Duda** (privada).
- El panel pide login (usuario/contraseña) contra `POST /webhook/fitkid-auth` con
  `{ usuario, contrasena }` (sin ñ) y espera `{ ok, token, rol, nombre, expira }`. El token se guarda **solo en una variable de JavaScript en
  memoria** (nunca en localStorage/sessionStorage/cookies) y se pierde al recargar la página.
- Cada acción manda el token en el header `Authorization: Bearer <token>` contra
  `/webhook/fitkid-staff-acciones` y `/webhook/fitkid-stripe-link`. Ya no hay ningún secreto
  fijo en el código del panel.
- Si el backend responde 401, el panel borra el token y regresa a la pantalla de login
  ("Tu sesión expiró, vuelve a entrar"). Si estaba abierto el kiosco manual, se cierra y
  los check-ins que estaban en cola sin conexión se pierden.
- Rol `staff` ve todo el panel; rol `kiosco` ve solo la pantalla de check-in por código
  (`/webhook/fitkid-qr-scan`); rol `tutor` no puede entrar por aquí (se rechaza en el front).

## Verificación de alumno en front desk
- Se muestra antes de la ficha cuando `Verificado en front desk` viene en false.
- Guarda con la acción `verificar_alumno` (contrato del 18-sep: `programa`, `horario_id`,
  `dias`, `hora_clase`, `alergias` y `tutor` anidado con teléfonos en formato `+52##########`).
  El servidor calcula edad, categoría y la alerta de edad/horario.
- **`MOCK_VERIFICAR` (index.html) está en `false`**: guarda contra el webhook real.
- El programa se lee del **nombre** del bloque, nunca de la hora: el catálogo tiene bloques
  distintos a la misma hora (FitParents 7-8 PM y Olímpica 7-8 PM). Si el nombre no dice el
  programa, se manda `Requiere revisión`.
- `hora_clase` se deduce del nombre del bloque solo si corresponde a una única opción de
  "Hora de clase"; las opciones `(FitParents)` nunca se asignan a un bloque infantil. Si no
  se puede deducir, el staff elige la hora de la lista.

## Botón "Escanear tarjeta" (QR del Portal de Padres)
- Abre la cámara trasera y lee el QR con la API `BarcodeDetector` del navegador (sin librerías).
  Funciona en Chrome para Android; **Safari (iPad/iPhone) no la tiene**, ahí se ofrece buscar por nombre.
- El iframe de Duda necesita `allow="camera"` (ver arriba); sin eso el navegador niega la cámara.
- Al leer: `POST /webhook/fitkid-qr-scan` con `{ qr_token }` (Bearer). Buscar por nombre usa la acción
  `estado_checkin` con `{ alumno_id }` y espera la misma respuesta.
- Botones: "Cobrar crédito y marcar asistencia" (`guardar_asistencias` con `estatus: 'Asistió'`),
  "Registrar en esta clase" (`registrar_en_clase`) y "Agregar a lista de espera" (`agregar_lista_espera`).
  **Pendiente en n8n:** `fitkid-qr-scan`, `estado_checkin`, `registrar_en_clase` y `agregar_lista_espera`.
  Por eso **`MOCK_ESCANER` (index.html) está en `true`**: el check-in no sale del navegador y
  simula por turnos los tres escenarios (con clase hoy, sin clase con cupo, y bloque lleno).
  Ponlo en `false` cuando los endpoints existan.
- La cámara se apaga al leer un código, al salir de la pantalla, al ocultar la pestaña o al perder la sesión.

## Botón "Abrir kiosco" (check-in manual con foto, desde el panel de staff)
Cualquier staff logueado puede tocar **"Abrir kiosco"** en el inicio del panel para convertir
el dispositivo en un kiosco temporal, sin necesitar la cuenta separada de rol `kiosco`:
1. Elige el bloque de clase activo (de `horarios_lista`).
2. Entra en pantalla completa con lista de alumnos del bloque + buscador.
3. Al tocar un alumno, abre la cámara para capturar su foto (o "Sin foto") y registra la
   asistencia con `guardar_asistencias` (misma acción que "Pasar lista").
4. **Pendiente en n8n:** si hay foto, el panel manda una acción nueva
   `guardar_foto_alumno` con `{ alumno_id, foto_base64 }` (JPEG recomprimido a ~480px de
   ancho, va como data URL). El router `wf-staff-acciones` todavía **no** tiene esta acción
   implementada — hay que agregarla (por ejemplo, subir la foto a Notion/Drive y guardar la
   referencia en la ficha del alumno). Mientras no exista, esas llamadas fallan silenciosamente
   y el check-in se guarda igual, pero sin la foto (o se encola si además no hay conexión).
5. Si una llamada falla (sin conexión), el registro queda en una cola **solo en memoria**
   (no se guarda en el navegador) con reintento automático cada 60 s y al reconectar; se pierde
   si se recarga la página a propósito.
6. Para salir del kiosco hay que volver a escribir usuario y contraseña de staff (reutiliza
   `/webhook/fitkid-auth`) y solo acepta cuentas de rol `staff`; no existe un PIN numérico separado.

---

## Portal de Padres (portal.html)
**`MOCK_PORTAL` (portal.html) está en `true`**: entra con cualquier correo y cualquier código
de 6 dígitos y muestra datos de ejemplo, porque `fitkid-portal-otp`, `-verify` y `-acciones`
todavía no existen. Ponlo en `false` cuando estén publicados.

## Estado del router (18-sep)
- Ya no acepta el secreto viejo: solo `Authorization: Bearer <token>` contra `fitkid_sesiones`.
- 14 acciones de escritura exigen rol `staff`; con otro rol responden
  `{ok:false, error:'tu rol no puede ejecutar esta acción'}` y el panel lo traduce a
  "Tu cuenta no tiene permiso para esta acción".
- `guardar_asistencias` responde `{actualizadas, recibidos, rechazados[]}`. El panel muestra
  los rechazos en vez de decir que todo salió bien (Pasar lista, kiosco y escáner).
- Una acción desconocida responde `ok:false`.

## (Alternativa) PWA instalable
Esta vía n8n **no** permite instalar el panel como app (ícono en pantalla). Si más adelante
quieres eso (mejor para tablet de mostrador), publicamos los archivos en GitHub Pages o
Firebase Hosting y cambiamos el iframe a esa URL. Archivos listos en outputs:
`fitkid-staff-widget.html` (→ index.html), `manifest.webmanifest`, `sw.js`, `icon.svg`.
