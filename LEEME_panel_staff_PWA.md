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
  allow="clipboard-write"></iframe>
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
- El panel manda un secreto (`fitkid-staff-2026`) que el router valida. Si lo cambias en
  `wf-staff-acciones` (constante `SECRET`), hay que cambiarlo también en el panel.
- Recomendado: rota ese secreto antes de producción real.

---

## (Alternativa) PWA instalable
Esta vía n8n **no** permite instalar el panel como app (ícono en pantalla). Si más adelante
quieres eso (mejor para tablet de mostrador), publicamos los archivos en GitHub Pages o
Firebase Hosting y cambiamos el iframe a esa URL. Archivos listos en outputs:
`fitkid-staff-widget.html` (→ index.html), `manifest.webmanifest`, `sw.js`, `icon.svg`.
