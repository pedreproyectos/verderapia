import { config, fields, collection, singleton } from "@keystatic/core";
import { keystaticMode, keystaticRepo } from "./src/data/keystatic-mode";

/**
 * Keystatic CMS.
 *
 * - En desarrollo editamos los archivos locales (`pnpm dev` → /keystatic).
 * - En producción usamos GitHub: los cambios se commitean al mismo repositorio
 *   y Cloudflare vuelve a construir el sitio automáticamente.
 *
 * Variables de entorno para producción:
 *   KEYSTATIC_STORAGE=github
 *   KEYSTATIC_REPO=usuario/repositorio
 *   KEYSTATIC_GITHUB_CLIENT_ID=...
 *   KEYSTATIC_GITHUB_CLIENT_SECRET=...
 *   KEYSTATIC_SECRET=...
 *   PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
 */
const useGitHub = keystaticMode === "github";
const repo = keystaticRepo;

export default config({
  storage: useGitHub ? { kind: "github", repo } : { kind: "local" },
  ui: {
    brand: { name: "Verderapia" },
  },
  collections: {
    posts: collection({
      label: "Novedades",
      path: "src/content/posts/*",
      format: { contentField: "content" },
      slugField: "title",
      columns: ["date", "draft"],
      schema: {
        title: fields.slug({ name: { label: "Título" } }),
        description: fields.text({ label: "Descripción", multiline: true }),
        date: fields.date({ label: "Fecha" }),
        cover: fields.image({
          label: "Imagen de portada",
          directory: "public/images/uploads",
          publicPath: "/images/uploads/",
          validation: { isRequired: false },
        }),
        tags: fields.array(fields.text({ label: "Etiqueta" }), {
          label: "Etiquetas",
          itemLabel: (props) => props.value,
        }),
        author: fields.text({
          label: "Autor",
          defaultValue: "Ingrid — Verderapia",
        }),
        draft: fields.checkbox({ label: "Borrador", defaultValue: false }),
        content: fields.markdoc({ label: "Contenido" }),
      },
    }),

    slides: collection({
      label: "Slider principal (home)",
      path: "src/content/slides/*",
      format: { data: "yaml" },
      slugField: "title",
      columns: ["order", "eyebrow"],
      schema: {
        title: fields.slug({
          name: { label: "Título" },
          slug: {
            label: "Identificador",
            description:
              "Nombre del archivo. No cambia lo que se ve en el sitio.",
          },
        }),
        eyebrow: fields.text({ label: "Antetítulo (eyebrow)" }),
        text: fields.text({
          label: "Descripción",
          multiline: true,
          description: "Texto que se muestra junto al título sobre la imagen.",
        }),
        image: fields.image({
          label: "Imagen",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: true },
        }),
        alt: fields.text({
          label: "Texto alternativo (alt)",
          description: "Descripción breve de la imagen para accesibilidad.",
        }),
        order: fields.integer({
          label: "Orden",
          description: "Las diapositivas se muestran de menor a mayor.",
          defaultValue: 0,
        }),
      },
    }),

    pilares: collection({
      label: "Pilares (Verde, Arte, Terapia)",
      path: "src/content/pilares/*",
      format: { data: "yaml" },
      slugField: "titulo",
      columns: ["order", "subtitulo"],
      schema: {
        titulo: fields.slug({
          name: { label: "Título" },
          slug: {
            label: "Identificador",
            description:
              "Nombre del archivo. Define el ancla del menú (#verde, #arte, #terapia). No lo cambies si quieres mantener los enlaces.",
          },
        }),
        eyebrow: fields.text({ label: "Antetítulo (eyebrow)" }),
        subtitulo: fields.text({ label: "Subtítulo" }),
        descripcion: fields.text({ label: "Descripción", multiline: true }),
        items: fields.array(fields.text({ label: "Ítem" }), {
          label: "Ítems",
          itemLabel: (props) => props.value,
        }),
        imagen: fields.image({
          label: "Imagen",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: true },
        }),
        order: fields.integer({
          label: "Orden",
          description: "Los pilares se muestran de menor a mayor.",
          defaultValue: 0,
        }),
      },
    }),

    ctas: collection({
      label: "Botones",
      path: "src/content/ctas/*",
      format: { data: "yaml" },
      slugField: "label",
      columns: ["principal", "order", "href"],
      schema: {
        label: fields.slug({
          name: { label: "Texto del botón" },
          slug: {
            label: "Identificador",
            description:
              "Nombre del archivo. No cambia lo que se ve en el sitio.",
          },
        }),
        href: fields.text({
          label: "Enlace",
          description:
            "URL completa o ancla interna, por ejemplo /posts/ o #verde.",
          validation: { isRequired: true },
        }),
        principal: fields.checkbox({
          label: "Call to action principal",
          description:
            "Marca solo uno: se muestra arriba del resto y también en el menú.",
          defaultValue: false,
        }),
        order: fields.integer({
          label: "Orden",
          description:
            "Los call to action secundarios se muestran de menor a mayor.",
          defaultValue: 0,
        }),
        external: fields.checkbox({
          label: "Abrir en pestaña nueva",
          defaultValue: true,
        }),
      },
    }),

    servicios: collection({
      label: "Servicios",
      path: "src/content/servicios/*",
      format: { data: "yaml" },
      slugField: "nombre",
      columns: ["nombre"],
      schema: {
        nombre: fields.slug({
          name: { label: "Nombre" },
          slug: {
            label: "Identificador",
            description:
              "Nombre del archivo. No cambia lo que se ve en el sitio.",
          },
        }),
        descripcion: fields.text({ label: "Descripción", multiline: true }),
        imagen: fields.image({
          label: "Imagen",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: false },
        }),
        horarios: fields.array(
          fields.object({
            dia: fields.text({ label: "Día" }),
            clases: fields.array(
              fields.object({
                hora: fields.text({ label: "Hora" }),
                nombre: fields.text({ label: "Nombre" }),
              }),
              {
                label: "Clases",
                itemLabel: (props) =>
                  `${props.fields.hora.value} — ${props.fields.nombre.value}`,
              },
            ),
          }),
          {
            label: "Horarios",
            itemLabel: (props) => props.fields.dia.value,
          },
        ),
        precios: fields.array(
          fields.object({
            nombre: fields.text({ label: "Nombre" }),
            detalle: fields.text({ label: "Detalle" }),
            valor: fields.text({ label: "Valor" }),
          }),
          {
            label: "Precios",
            itemLabel: (props) => props.fields.nombre.value,
          },
        ),
        nota: fields.text({ label: "Nota", multiline: true }),
      },
    }),
  },

  singletons: {
    historia: singleton({
      label: "Historia principal",
      path: "src/content/historia/",
      format: { data: "yaml" },
      schema: {
        eyebrow: fields.text({ label: "Antetítulo" }),
        titulo: fields.text({ label: "Título" }),
        texto: fields.text({ label: "Texto", multiline: true }),
        imagen: fields.image({
          label: "Imagen principal",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: false },
        }),
        imagen2: fields.image({
          label: "Imagen secundaria",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: false },
        }),
      },
    }),

    giftcard: singleton({
      label: "Gift Card y descuentos",
      path: "src/content/giftcard/",
      format: { data: "yaml" },
      schema: {
        imagen: fields.image({
          label: "Imagen de fondo",
          directory: "public/images/verderapia",
          publicPath: "/images/verderapia/",
          validation: { isRequired: false },
        }),
        titulo: fields.text({ label: "Título" }),
        descuentoTitulo: fields.text({ label: "Título del descuento" }),
        descuentoAdicional: fields.text({ label: "Descuento adicional" }),
        descuentoNota: fields.text({ label: "Nota de descuentos" }),
        promos: fields.array(
          fields.object({
            titulo: fields.text({ label: "Título" }),
            detalle: fields.text({ label: "Detalle" }),
          }),
          {
            label: "Promociones",
            itemLabel: (props) => props.fields.titulo.value,
          },
        ),
      },
    }),
  },
});
