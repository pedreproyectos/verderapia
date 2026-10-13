import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Entradas de blog / novedades. Editables desde /admin (Decap/Sveltia CMS). */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/instagram' }),
  schema: z.object({
    caption: z.string(),
    image: z.string(),
    permalink: z.string().default('https://www.instagram.com/verderapia/'),
    date: z.coerce.date(),
    likes: z.number().default(0),
    order: z.number().default(0),
  }),
});

export const collections = { posts, instagram };
