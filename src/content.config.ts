import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

/** Posts que se muestran en el feed de Instagram del sitio. */
const instagram = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/instagram' }),
  schema: z.object({
    // Solo se usa para nombrar el archivo en el CMS.
    title: z.string().optional(),
    caption: z.string(),
    image: z.string(),
    permalink: z.string().default('https://www.instagram.com/verderapia/'),
    date: z.coerce.date(),
    likes: z.number().default(0),
    order: z.number().default(0),
  }),
});

/**
 * Call to actions del sitio. Editables desde Keystatic (/keystatic).
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

export const collections = { posts, instagram, ctas };
