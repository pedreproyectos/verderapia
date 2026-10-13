# Verderapia — 3 alternativas de one-page

Sitio one-page para **Verderapia** (parcela sustentable, terapias, yoga y arte en Quilpué),
construido con **Astro** (y Tailwind disponible). Incluye **tres propuestas de diseño**
seleccionables, un **admin de posts** basado en Git y un **feed de Instagram**.

## 🚀 Comandos

```sh
npm install        # o pnpm install
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # genera el sitio estático en ./dist
npm run preview    # previsualiza la build
npm run cms        # proxy local del CMS (decap-server) para editar en /admin
```

## 🎨 Las tres propuestas

| Ruta | Tema | Estilo |
| --- | --- | --- |
| `/` | Selector | Portada con las 3 alternativas y sus paletas |
| `/tema1/` | **Raíces** | Botánico cálido · hero a pantalla completa con slider *Ken Burns*, secciones orgánicas, menú de terapias en lista, serif *Fraunces* |
| `/tema2/` | **Editorial** | Minimal claro · hero partido con slider deslizante, retícula tipo revista, terapias en acordeón, esquinas rectas |
| `/tema3/` | **Noche verde** | Oscuro moderno · hero con *glassmorphism* y gradientes, slider apilado, tarjetas de vidrio y acentos neón |

Cada tema comparte el mismo contenido y estos bloques:

1. Nav fijo con menú responsive
2. Hero con **slider** (autoplay, flechas, puntos, swipe y teclado)
3. Historia + elementos (agua · tierra · luz · aire)
4. Pilares: **Verde · Arte · Terapia**
5. Terapias y masajes (9 servicios con duración y precios)
6. Yoga (horarios y precios)
7. Talleres (Lombricultura)
8. Novedades (posts del admin)
9. **Feed de Instagram**
10. Gift Card y descuentos
11. Contacto + mapa
12. Footer con redes

### Estructura

```
src/
├─ content.config.ts        # colecciones posts + instagram
├─ content/
│  ├─ posts/                # entradas del blog (editables en /admin)
│  └─ instagram/            # posts del feed de Instagram (editables en /admin)
├─ data/
│  ├─ site.ts               # todo el contenido del negocio (desde verderapia.md)
│  ├─ images.ts             # catálogo de imágenes + selecciones curadas
│  └─ instagram.json        # configuración del feed (usuario, perfil, embed)
├─ components/              # Slider, InstagramFeed, Pilares, Terapias, etc.
├─ layouts/Base.astro       # <head>, fuentes y sistema de estilos
├─ styles/global.css        # sistema de diseño + variables por tema
├─ temas/
│  ├─ tema1/Theme.astro     # propuesta 1
│  ├─ tema2/Theme.astro     # propuesta 2
│  └─ tema3/Theme.astro     # propuesta 3
└─ pages/
   ├─ index.astro           # selector de propuestas
   ├─ tema1.astro / tema2.astro / tema3.astro
   └─ posts/index.astro, posts/[slug].astro
```

## 📝 Admin de posts (`/admin`)

Panel basado en Git con **Decap CMS** (compatible con **Sveltia CMS** — solo cambia el
`<script>` en `public/admin/index.html`). Configuración en `public/admin/config.yml`.

Colecciones administrables:

- **Novedades** → `src/content/posts/*.md` (aparecen en la sección *Novedades* y en `/posts`)
- **Feed de Instagram** → `src/content/instagram/*.md` (aparecen en el feed del sitio)
- **Configuración del sitio → Instagram** → `src/data/instagram.json`

### Editar en local

```sh
npm run cms        # levanta decap-server en http://localhost:8081
npm run dev        # en otra terminal
# abre http://localhost:4321/admin/
```

`local_backend: true` ya está activado en `config.yml`.

### Publicar

- **Netlify:** activa Git Gateway e Identity (el `backend: git-gateway` ya está configurado).
- **GitHub:** cambia en `config.yml` por `backend: { name: github, repo: usuario/repo, branch: main }`.
- **Sveltia:** reemplaza el script del CDN en `public/admin/index.html`.

## 📸 Feed de Instagram

`src/components/InstagramFeed.astro` funciona de dos maneras:

1. **Posts administrados** (por defecto): toma las entradas de la colección `instagram`
   (imagen, texto, enlace, fecha, likes y orden).
2. **Embed en vivo**: si rellenas `embed_src` en `src/data/instagram.json` (o pasas la prop
   `embedSrc`), se muestra un iframe de un widget externo como LightWidget, Behold o EmbedSocial.

El perfil y el usuario se leen de `instagram.json`, así que puedes cambiarlos sin tocar código.

## 🖼️ Imágenes

Las 359 fotos optimizadas (`.webp`) están en `public/images/verderapia/`. El catálogo y las
selecciones por sección viven en `src/data/images.ts`. Las subidas del CMS van a
`public/images/uploads/`.

## 📄 Contenido

Todo el texto proviene de `verderapia.md` y está centralizado en `src/data/site.ts`
(contacto, pilares, terapias, yoga, talleres, promociones, SEO).
