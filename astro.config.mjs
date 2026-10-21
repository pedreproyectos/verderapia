// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// En desarrollo usamos el adaptador de Node para que Keystatic pueda leer y
// escribir los archivos del proyecto. En build/producción usamos Cloudflare.
const useNodeAdapter = process.env.ASTRO_ADAPTER === 'node';

// Valores de Keystatic inyectados como literales por Vite (funcionan igual en
// el cliente y en el servidor, sin depender de `process` en el navegador).
const keystaticStorage =
  process.env.KEYSTATIC_STORAGE ??
  (process.env.NODE_ENV === 'production' ? 'github' : 'local');
const keystaticRepo = process.env.KEYSTATIC_REPO ?? 'pedreproyectos/verderapia';

// https://astro.build/config
export default defineConfig({
  site: 'https://verderapia.cl',
  // La propuesta 1 es la definitiva: las URLs antiguas de las propuestas
  // redirigen a la portada.
  redirects: {
    '/tema1': '/',
    '/tema2': '/',
    '/tema3': '/',
    '/admin': '/keystatic',
  },
  // Keystatic necesita rutas de servidor (OAuth/API de GitHub) además del
  // sitio estático, por eso usamos el adaptador de Cloudflare en producción.
  adapter: useNodeAdapter
    ? node({ mode: 'standalone' })
    : cloudflare({
        imageService: 'compile',
        prerenderEnvironment: 'node',
      }),
  integrations: [react(), markdoc(), keystatic()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    define: {
      __KEYSTATIC_STORAGE__: JSON.stringify(keystaticStorage),
      __KEYSTATIC_REPO__: JSON.stringify(keystaticRepo),
    },
    plugins: [tailwindcss()],
  },
});
