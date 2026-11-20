import type { APIRoute } from 'astro';
import { getEnv, siteUrl } from '../../../lib/paywall';

export const prerender = false;

function pagina(titulo: string, mensaje: string, enlace: string): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <meta name="robots" content="noindex">
     <title>${titulo} — Verderapia</title>
     <style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f1e9;color:#222;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
     .caja{max-width:520px;background:#fff;border:1px solid #e2ddcf;border-radius:18px;padding:32px;text-align:center;box-shadow:0 18px 50px -30px rgba(0,0,0,.4)}
     h1{font-size:1.4rem;margin:0 0 12px}p{line-height:1.6;color:#444}
     a{display:inline-block;margin-top:16px;background:#2f5d3a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600}</style>
     </head><body><div class="caja"><h1>${titulo}</h1><p>${mensaje}</p>
     <a href="${enlace}">Volver al inicio</a></div></body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

export const GET: APIRoute = async ({ locals }) => {
  const env = await getEnv(locals);
  return pagina(
    'Pago en proceso',
    'Estamos confirmando tu pago con la pasarela. En cuanto se acredite, recibirás un correo con el enlace de acceso al curso. Esto puede tardar unos minutos.',
    siteUrl(env),
  );
};
