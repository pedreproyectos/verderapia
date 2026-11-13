import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Entradas de blog / novedades. Editables desde /keystatic (Keystatic CMS). */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Ruta relativa a /public (compatible con el gestor de medios del CMS).
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Ingrid — Verderapia'),
    draft: z.boolean().default(false),
  }),
});

/** Diapositivas del slider principal del home. Editables desde Keystatic (/keystatic). */
const slides = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/slides' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string().optional(),
    text: z.string().optional(),
    image: z.string(),
    alt: z.string().optional(),
    order: z.number().default(0),
  }),
});

/** Pilares del sitio (Verde, Arte, Terapia). Editables desde Keystatic (/keystatic). */
const pilares = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pilares' }),
  schema: z.object({
    titulo: z.string(),
    eyebrow: z.string().optional(),
    subtitulo: z.string().optional(),
    descripcion: z.string().optional(),
    items: z.array(z.string()).default([]),
    imagen: z.string(),
    order: z.number().default(0),
  }),
});

/** Historia principal del home. Editable desde Keystatic (/keystatic) como singleton. */
const historia = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/historia' }),
  schema: z.object({
    eyebrow: z.string().optional(),
    titulo: z.string().optional(),
    texto: z.string().optional(),
    imagen: z.string().optional(),
    imagen2: z.string().optional(),
  }),
});

/** Gift Card y descuentos. Singleton editable desde Keystatic. */
const giftcard = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/giftcard' }),
  schema: z.object({
    imagen: z.string().optional(),
    titulo: z.string().optional(),
    descuentoTitulo: z.string().optional(),
    descuentoAdicional: z.string().optional(),
    descuentoNota: z.string().optional(),
    promos: z
      .array(z.object({ titulo: z.string().optional(), detalle: z.string().optional() }))
      .default([]),
  }),
});

/** Servicios (con horarios y precios). Editables desde Keystatic. */
const servicios = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/servicios' }),
  schema: z.object({
    nombre: z.string(),
    descripcion: z.string().optional(),
    imagen: z.string().optional(),
    horarios: z
      .array(
        z.object({
          dia: z.string().optional(),
          clases: z
            .array(z.object({ hora: z.string().optional(), nombre: z.string().optional() }))
            .default([]),
        }),
      )
      .default([]),
    precios: z
      .array(
        z.object({
          nombre: z.string().optional(),
          detalle: z.string().optional(),
          valor: z.string().optional(),
        }),
      )
      .default([]),
    nota: z.string().optional(),
  }),
});

/** Call to actions del sitio. Editables desde Keystatic (/keystatic).
 * Uno puede marcarse como `principal` (aparece arriba); el resto se
 * ordena con `order`.
 */
const ctas = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/ctas' }),
  schema: z.object({
    label: z.string(),
    href: z.string(),
    principal: z.boolean().default(false),
    order: z.number().default(0),
    external: z.boolean().default(true),
  }),
});

export const collections = { posts, slides, pilares, ctas, historia, giftcard, servicios };
