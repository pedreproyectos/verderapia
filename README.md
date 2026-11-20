# Verderapia

Sitio one-page de Verderapia (Astro + Tailwind), con **Keystatic** como CMS y
deploy en **Cloudflare Workers**.

<!-- Prueba de trigger de deploy (2) -->

## Desarrollo

```sh
pnpm install
pnpm dev        # http://localhost:4321
```

El panel de contenidos queda en **http://localhost:4321/keystatic**.

En desarrollo se usa el adaptador de Node y el almacenamiento local de
Keystatic, así que los cambios se escriben directamente en los archivos del
proyecto. Usa siempre `pnpm dev` (no `astro dev` directo): el script activa el
adaptador de Node y genera la configuración del CMS.

## Contenido

Todo se administra desde **`/keystatic`**. La antigua ruta `/admin` redirige a
`/keystatic`.

### Call to actions

Cada CTA es un archivo YAML en `src/content/ctas/`:

```yaml
label: Agenda tu terapia
href: https://wa.me/56987548041
principal: true
order: 0
external: true
```

- **principal**: checkbox. Marca **solo uno**: se muestra arriba del resto y
  también en el menú de navegación.
- **order**: número para ordenar los CTAs secundarios (los que van debajo del
  principal).
- **external**: abre el enlace en una pestaña nueva.

### Servicios

Cada servicio es un archivo YAML en `src/content/servicios/` y se muestra como
un desplegable en la sección **Talleres y Servicios** del home.

```yaml
nombre: Mirada sistémica
subtitulo: ""            # opcional, línea bajo el título
descripcion: Explora tus vínculos, tu historia familiar y los patrones...
icono: sistema           # tarot | flor | brote | cuerpo | sistema
tono: verde              # amarillo | lavanda | rosa | menta | verde
detalles:                # opcional, líneas breves bajo la descripción
  - Constelaciones familiares
  - Genograma
orden: 5                 # los servicios se muestran de menor a mayor
horarios: [...]
precios: [...]
nota: ""                 # opcional, texto final del desplegable
```

La imagen principal de la sección es común a todos los servicios y vive en
`public/images/verderapia/servicios/servicios-main.webp` (se cambia editando
`src/components/Servicios.astro`). El campo `imagen` de cada servicio se
mantiene por compatibilidad, pero el acordeón no lo usa.

### Terapias y precios

La lista larga de precios del home (sección **Terapias y masajes**) se
administra en `src/content/terapias/`. Cada archivo YAML es una terapia:

```yaml
nombre: Masaje de relajación
descripcion: Relaja la musculatura, disminuye el estrés...
duracion: 75 min
precio: $25.000
extra: "Masaje + Cama de Jade: $28.000"   # opcional
orden: 1                                   # menor a mayor
```

Al agregar, editar o quitar archivos en esa carpeta, la lista del sitio se
actualiza en el siguiente build (Keystatic hace el commit automáticamente).

### Novedades y feed de Instagram

- **Novedades / blog**: `src/content/posts/*.mdoc` (Markdoc). Se ven en `/posts`
  y en la sección Novedades de la home.
- **Feed de Instagram**: se obtiene de un feed JSON de Behold
  (`INSTAGRAM_FEED_URL`) o de la API de Instagram (`INSTAGRAM_ACCESS_TOKEN` +
  `INSTAGRAM_BUSINESS_ID`). Si no hay ninguno, usa `src/data/instagram.json`.
- **Actualización de Instagram**: la home se genera en el build, pero
  `/api/instagram` entrega el feed en vivo y el navegador reemplaza las tarjetas
  al cargar la página. Así los posts nuevos aparecen sin volver a desplegar. La
  respuesta se cachea 3 horas para no agotar las 1.200 vistas mensuales de
  Behold. El plan free de Behold refresca su feed una vez al día; para
  actualizaciones cada hora se necesita el plan Starter.
- **Call to actions**: `src/content/ctas/*.yaml`.
- **Datos del negocio**: `src/data/site.ts` (textos fijos que no están en el CMS).

---

# Deploy en Cloudflare

El proyecto se despliega como **Cloudflare Worker** con assets estáticos y rutas
de servidor para Keystatic (OAuth/API de GitHub). El build genera:

- `dist/client/` → assets estáticos.
- `dist/server/` → worker de Astro.
- `.wrangler/deploy/config.json` → apunta al config generado por el adaptador.

`wrangler.jsonc` ya está configurado con:

```jsonc
{
  "name": "verderapia",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": "./dist", "binding": "ASSETS" },
  "routes": [
    { "pattern": "verderapia.cl", "custom_domain": true },
    { "pattern": "www.verderapia.cl", "custom_domain": true }
  ]
}
```

## 1. Requisitos

- Repositorio en GitHub: `pedreproyectos/verderapia`.
- Cuenta de Cloudflare.
- Node **22.12 o superior** (definido en `package.json > engines`).
- Que `pnpm build` funcione en local.

## 2. Crear el Worker en Cloudflare

1. Entra a **Cloudflare Dashboard → Workers & Pages → Create**.
2. Elige **Workers → Connect to Git** (Workers Builds).
3. Selecciona el repositorio `pedreproyectos/verderapia` y la rama `master`
   (debe ser la rama por defecto del repo, que es donde Keystatic commitea).
4. Configura:
   - **Build command**: `pnpm build`
   - **Deploy command**: `npx wrangler deploy`
   - **Root directory**: `/`
   - **Node version**: `22.12.0` (o superior), si Cloudflare no lo detecta solo.

## 3. Variables y secretos

En **Settings → Variables and Secrets** del Worker.

### Build (se usan al construir)

| Variable | Valor |
| --- | --- |
| `KEYSTATIC_REPO` | `pedreproyectos/verderapia` |
| `KEYSTATIC_STORAGE` | `github` (opcional; el build ya usa producción) |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | slug de la GitHub App |
| `INSTAGRAM_FEED_URL` | URL del feed JSON de Behold (opcional) |
| `NODE_VERSION` | `22.12.0` (opcional) |

> `pnpm build` ejecuta `scripts/keystatic-mode.mjs --production`, que escribe
> `src/data/keystatic-mode.ts` con modo `github`. Ese archivo es generado: no lo
> edites a mano. En `pnpm dev` se genera con modo `local`.

### Runtime (secretos del Worker)

| Secreto | Valor |
| --- | --- |
| `KEYSTATIC_GITHUB_CLIENT_ID` | Client ID de la GitHub App |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | Client secret de la GitHub App |
| `KEYSTATIC_SECRET` | cadena aleatoria, ej: `openssl rand -hex 32` |

`src/middleware.ts` copia estos valores del binding `env` de Cloudflare a
`process.env`, que es donde Keystatic los busca.

## 4. Crear la GitHub App

En GitHub → **Settings → Developer settings → GitHub Apps → New GitHub App**.

1. Nombre: `Verderapia CMS` (o similar).
2. Homepage URL: `https://verderapia.cl`.
3. **Callback URL**:
   `https://verderapia.cl/api/keystatic/github/oauth/callback`
4. Permisos de repositorio:
   - **Contents: Read & write**
   - **Metadata: Read**
5. Crea la app y copia el **Client ID**; genera un **Client secret**.
6. Instala la app en `pedreproyectos/verderapia`.
7. El **slug** de la app está en la URL:
   `https://github.com/settings/apps/<slug>` → ese es
   `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.

### Agregar personas que editan contenido

Keystatic no tiene usuarios propios: en modo GitHub, **quien puede editar es
quien tiene permiso de escritura en el repositorio**. Para habilitar a alguien:

1. Debe tener una cuenta de GitHub.
2. En el repositorio, entra a **Settings → Manage access → Add people** y agrega
   su usuario con el rol **Write**.
3. La persona entra a `https://verderapia.cl/keystatic`, pulsa **Log in with
   GitHub** y autoriza la GitHub App la primera vez.

Los cambios que guarde se commitean a `master` y Cloudflare reconstruye el sitio
automáticamente. Para revocar el acceso, quita la persona del repositorio.

## 5. Desplegar

Con las variables cargadas:

- Haz push a `master`, o
- En Cloudflare entra al Worker → **Deployments → Deploy**.

Cloudflare ejecutará:

```sh
pnpm install --frozen-lockfile
pnpm build
npx wrangler deploy
```

## 6. Dominio personalizado

El dominio se conecta desde Cloudflare, no desde el código.

### Requisitos

- `verderapia.cl` registrado.
- El dominio agregado como **zona** en la misma cuenta de Cloudflare del Worker.
- Los nameservers del registrador apuntando a Cloudflare.

### Agregar el dominio

1. Cloudflare Dashboard → **Workers & Pages** → Worker `verderapia` →
   **Settings** → **Domains & Routes**.
2. Pulsa **Add** → **Custom domain**.
3. Escribe `verderapia.cl` → **Add domain**.
4. Repite con `www.verderapia.cl`.
5. Espera a que ambos aparezcan como **Active**.

Cloudflare crea el registro DNS y el certificado SSL automáticamente.

Si el dominio ya tenía registros DNS `A`, `AAAA` o `CNAME` para `@` o `www`
(por ejemplo, apuntando a otro hosting), bórralos antes de agregar el custom
domain. Cloudflare no puede crear el registro mientras exista uno en conflicto.

### Si el dominio aún no está en Cloudflare

1. Cloudflare Dashboard → **Add a site** → `verderapia.cl`.
2. Copia los nameservers que te entrega Cloudflare.
3. Cámbialos en el registrador del dominio.
4. Espera la propagación y luego agrega el **Custom domain** al Worker.

### Configuración en el repositorio

`wrangler.jsonc` ya declara los dos dominios:

```jsonc
"routes": [
  { "pattern": "verderapia.cl", "custom_domain": true },
  { "pattern": "www.verderapia.cl", "custom_domain": true }
]
```

Al desplegar con `npx wrangler deploy`, Cloudflare intenta crearlos. Si la zona
todavía no está activa, el deploy falla: en ese caso agrégalos primero desde el
dashboard.

### Redirigir `www` a `verderapia.cl`

El middleware de Astro solo se ejecuta en rutas dinámicas (Keystatic, API). Las
páginas generadas en el build (`/`, `/posts/...`) las sirve directamente el
binding de assets de Cloudflare, sin pasar por el middleware. Por eso el
redirect de `www` debe hacerse en la zona, no en Astro.

En Cloudflare Dashboard → `verderapia.cl` → **Rules** → **Redirect Rules** →
**Create rule**:

- **When incoming requests match**: `Custom filter expression`
  - Field: `Hostname`, Operator: `equals`, Value: `www.verderapia.cl`
- **Then**:
  - Type: `Dynamic`
  - Expression: `concat("https://verderapia.cl", http.request.uri.path)`
  - Status code: `301`
  - Preserve query string: activado

Guarda y prueba:

```sh
curl -sI https://www.verderapia.cl/posts/ | grep -iE 'HTTP/|location'
```

Debe responder `301` con `location: https://verderapia.cl/posts/`.

`src/middleware.ts` mantiene el mismo redirect para las rutas dinámicas, como
respaldo si la regla de la zona no está configurada.

## 7. Verificar

1. `https://verderapia.cl/` carga la home.
2. `https://www.verderapia.cl/` responde **301 → https://verderapia.cl/**.
3. `https://verderapia.cl/keystatic` carga el panel y permite iniciar sesión con
   GitHub.
4. Edita un CTA y guarda: Keystatic crea un commit en el repo y Cloudflare
   vuelve a construir el sitio.
5. `https://verderapia.cl/admin` responde **301 → /keystatic**.
6. `/posts/...` y el feed de Instagram funcionan.

## 8. Deploy manual desde local (opcional)

```sh
pnpm install
pnpm build
npx wrangler login
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
npx wrangler secret put KEYSTATIC_SECRET
pnpm deploy        # build + wrangler deploy
```

`pnpm deploy` equivale a `pnpm build && wrangler deploy`.

## Cursos y paywall

Cursos asincrónicos en video (Vimeo), con pago único por curso y entrega del
acceso por correo.

### Contenido

Se administra en **Keystatic → Cursos**. Cada curso tiene dos partes y cada parte
sus videos (`vimeoId` + `vimeoHash`). Los videos deben estar en Vimeo con
privacidad *Unlisted*, *Embed only* y dominio permitido `verderapia.cl`.

El precio se define en CLP (IVA incluido) y el curso no aparece hasta marcar
**Publicado**.

### Rutas

| Ruta | Qué hace |
| --- | --- |
| `/cursos/` | Listado público |
| `/cursos/[slug]` | Página de venta + formulario de compra |
| `/acceso/` | Pedir un enlace nuevo |
| `/acceso/[token]` | Canje del enlace del correo (crea sesión) |
| `/curso/[slug]/ver` | Área protegida con los videos |
| `/admin/ordenes` | Panel de órdenes (Basic auth con `ADMIN_TOKEN`) |
| `/api/checkout` | Crea la orden y el pago en Flow |
| `/api/webhooks/flow` | Confirma el pago y envía el correo |
| `/api/acceso/reenviar` | Reenvía el enlace de acceso |

### Variables y secretos

| Nombre | Tipo | Uso |
| --- | --- | --- |
| `DB` | binding D1 | Órdenes, tokens, sesiones y logs |
| `FLOW_API_KEY` | secreto | Crear pagos |
| `FLOW_SECRET` | secreto | Firmar y consultar pagos |
| `FLOW_SANDBOX` | variable | `1` para sandbox |
| `RESEND_API_KEY` | secreto | Enviar el correo de acceso |
| `EMAIL_FROM` | variable | `cursos@verderapia.cl` |
| `ADMIN_TOKEN` | secreto | Contraseña del panel (usuario `admin`) |
| `PUBLIC_SITE_URL` | variable | `https://verderapia.cl` |
| `PAYMENTS_MODE` | variable | `demo` solo para pruebas; **nunca en producción** |

### Base de datos

```sh
npx wrangler d1 migrations apply verderapia-paywall --remote \
  --file=migrations/0001_paywall.sql
```

O pegar `migrations/0001_paywall.sql` en **D1 → Console** del dashboard.

### Probar sin cobrar (local)

```sh
cp .dev.vars.example .dev.vars
npx wrangler d1 execute verderapia-paywall --local --file=migrations/0001_paywall.sql
pnpm build
npx wrangler dev --local
```

Con `PAYMENTS_MODE=demo`, el checkout crea la orden pagada, genera el enlace y
redirige a `/acceso/<token>` como si hubiera pagado. Los correos quedan
registrados en `email_log` como `skipped` si no hay `RESEND_API_KEY`.

### Producción

1. Cargar `FLOW_API_KEY`, `FLOW_SECRET`, `RESEND_API_KEY`, `ADMIN_TOKEN` como
   secretos del Worker.
2. Configurar el webhook de Flow en `https://verderapia.cl/api/webhooks/flow`.
3. Verificar el dominio de correo en Resend (SPF, DKIM, DMARC).
4. Dejar `PAYMENTS_MODE` sin valor (o distinto de `demo`).

## Problemas comunes

- **`ERR_PNPM_IGNORED_BUILDS`**: pnpm 11 bloquea scripts de instalación. Ya están
  aprobados `esbuild` y `workerd` en `pnpm-workspace.yaml > allowBuilds`. Si
  aparece otra dependencia, agrégala ahí con `true`.
- **`/keystatic` en blanco**: asegúrate de que el build haya usado modo GitHub
  (`src/data/keystatic-mode.ts` debe decir `github` en producción) y de que
  `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` esté definido al construir.
- **`redirect_uri` de GitHub**: revisa que el callback de la GitHub App sea
  exactamente `https://verderapia.cl/api/keystatic/github/oauth/callback`.
- **“Missing required config”**: faltan los secretos de GitHub en el Worker.
- **Commits no disparan deploy**: confirma que la rama por defecto del repo sea
  `master` y que Cloudflare esté conectado a esa rama.

## Notas técnicas

- En desarrollo Astro usa `@astrojs/node` (para que Keystatic pueda leer/escribir
  archivos). En build usa `@astrojs/cloudflare`.
- `pnpm dev` / `pnpm build` generan `src/data/keystatic-mode.ts` con
  `scripts/keystatic-mode.mjs`, para que la configuración de Keystatic sea válida
  también en el navegador (sin `process.env`).
- La propuesta 1 (Raíces) es el diseño definitivo; `/tema1`, `/tema2` y
  `/tema3` redirigen a `/`.
