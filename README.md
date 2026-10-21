# Verderapia

Sitio one-page de Verderapia (Astro + Tailwind), con **Keystatic** como CMS y
deploy en **Cloudflare Workers**.

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

### Novedades y feed de Instagram

- **Novedades / blog**: `src/content/posts/*.mdoc` (Markdoc). Se ven en `/posts`
  y en la sección Novedades de la home.
- **Feed de Instagram**: embed oficial de la cuenta en `src/data/instagram.json`
  (`embed_src`). Se actualiza automáticamente con las publicaciones reales.
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
  "name": "verde",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": "./dist", "binding": "ASSETS" }
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

## 6. Verificar

1. `https://verderapia.cl/` carga la home.
2. `https://verderapia.cl/keystatic` carga el panel y permite iniciar sesión con
   GitHub.
3. Edita un CTA y guarda: Keystatic crea un commit en el repo y Cloudflare
   vuelve a construir el sitio.
4. `https://verderapia.cl/admin` responde **301 → /keystatic**.
5. `/posts/...` y el feed de Instagram funcionan.

## 7. Deploy manual desde local (opcional)

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
