import { config, fields, collection } from '@keystatic/core';
import { keystaticMode, keystaticRepo } from './src/data/keystatic-mode';

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
const useGitHub = keystaticMode === 'github';
const repo = keystaticRepo;

export default config({
  storage: useGitHub ? { kind: 'github', repo } : { kind: 'local' },
  ui: {
    brand: { name: 'Verderapia' },
  },
  collections: {
    posts: collection({
      label: 'Novedades',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      slugField: 'title',
      columns: ['date', 'draft'],
      schema: {
        title: fields.slug({ name: { label: 'Título' } }),
        description: fields.text({ label: 'Descripción', multiline: true }),
        date: fields.date({ label: 'Fecha' }),
        cover: fields.image({
          label: 'Imagen de portada',
          directory: 'public/images/uploads',
          publicPath: '/images/uploads/',
          validation: { isRequired: false },
        }),
        tags: fields.array(fields.text({ label: 'Etiqueta' }), {
          label: 'Etiquetas',
          itemLabel: (props) => props.value,
        }),
        author: fields.text({ label: 'Autor', defaultValue: 'Ingrid — Verderapia' }),
        draft: fields.checkbox({ label: 'Borrador', defaultValue: false }),
        content: fields.markdoc({ label: 'Contenido' }),
      },
    }),

    ctas: collection({
      label: 'Call to actions',
      path: 'src/content/ctas/*',
      format: { data: 'yaml' },
      slugField: 'label',
      columns: ['principal', 'order', 'href'],
      schema: {
        label: fields.slug({
          name: { label: 'Texto del botón' },
          slug: {
            label: 'Identificador',
            description: 'Nombre del archivo. No cambia lo que se ve en el sitio.',
          },
        }),
        href: fields.text({
          label: 'Enlace',
          description: 'URL completa o ancla interna, por ejemplo /posts/ o #verde.',
          validation: { isRequired: true },
        }),
        principal: fields.checkbox({
          label: 'Call to action principal',
          description: 'Marca solo uno: se muestra arriba del resto y también en el menú.',
          defaultValue: false,
        }),
        order: fields.integer({
          label: 'Orden',
          description: 'Los call to action secundarios se muestran de menor a mayor.',
          defaultValue: 0,
        }),
        external: fields.checkbox({
          label: 'Abrir en pestaña nueva',
          defaultValue: true,
        }),
      },
    }),
  },
});
