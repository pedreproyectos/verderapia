// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://verderapia.cl',
  // La propuesta 1 es la definitiva: las URLs antiguas de las propuestas
  // redirigen a la portada.
  redirects: {
    '/tema1': '/',
    '/tema2': '/',
    '/tema3': '/',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
