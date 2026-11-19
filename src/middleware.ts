import { defineMiddleware } from 'astro:middleware';

let bridged = false;

/**
 * Cloudflare expone las variables y secretos del Worker en el binding `env`,
 * pero Keystatic los busca en `process.env`. En la primera petición copiamos
 * los valores de texto (variables y secretos) a `process.env`.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Canonicaliza el dominio: www.verderapia.cl → verderapia.cl.
  // Solo cubre rutas dinámicas; las páginas prerenderizadas las sirve el
  // binding de assets sin pasar por el middleware. Para cubrirlas todas hace
  // falta una Redirect Rule en la zona de Cloudflare (ver README).
  const url = new URL(context.request.url);
  if (
    url.hostname === 'www.verderapia.cl' &&
    (context.request.method === 'GET' || context.request.method === 'HEAD')
  ) {
    url.hostname = 'verderapia.cl';
    return context.redirect(url.toString(), 301);
  }

  if (!bridged) {
    bridged = true;
    try {
      // Specifier calculado para que Vite no intente resolverlo en dev (Node).
      const workersModule = ['cloudflare', 'workers'].join(':');
      const { env } = await import(/* @vite-ignore */ workersModule);
      for (const [key, value] of Object.entries(env ?? {})) {
        if (typeof value === 'string' && !(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch {
      // En desarrollo con el adaptador de Node este módulo no existe.
    }
  }
  return next();
});
