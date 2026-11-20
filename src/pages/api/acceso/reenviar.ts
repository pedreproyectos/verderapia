import type { APIRoute } from 'astro';
import {
  getEnv,
  getCursoServidor,
  crearTokenAcceso,
  enviarCorreoAcceso,
  isValidEmail,
  limitar,
  normalizeEmail,
  siteUrl,
  type Order,
} from '../../../lib/paywall';

export const prerender = false;

function pagina(mensaje: string, enlace: string): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <meta name="robots" content="noindex">
     <title>Enlace de acceso — Verderapia</title>
     <style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f1e9;color:#222;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
     .caja{max-width:520px;background:#fff;border:1px solid #e2ddcf;border-radius:18px;padding:32px;text-align:center;box-shadow:0 18px 50px -30px rgba(0,0,0,.4)}
     h1{font-size:1.4rem;margin:0 0 12px}p{line-height:1.6;color:#444}
     a{display:inline-block;margin-top:16px;background:#2f5d3a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600}</style>
     </head><body><div class="caja"><h1>Revisa tu correo</h1><p>${mensaje}</p>
     <a href="${enlace}">Volver al inicio</a></div></body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = await getEnv(locals);
  const db = env.DB;
  const origin = siteUrl(env);

  // Respuesta neutra siempre: no revelamos si el correo existe o no.
  const neutra =
    'Si ese correo tiene una compra registrada, te enviamos un enlace de acceso. Revisa también la carpeta de spam.';

  if (!db) return pagina(neutra, origin);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return pagina(neutra, origin);
  }

  const email = normalizeEmail(form.get('email'));
  if (!isValidEmail(email)) return pagina(neutra, origin);

  const ip = request.headers.get('cf-connecting-ip') ?? 'local';
  const porIp = await limitar(env, `reenvio-ip:${ip}`, 10, 3600);
  const porEmail = await limitar(env, `reenvio-mail:${email}`, 3, 3600);
  if (!porIp || !porEmail) return pagina(neutra, origin);

  const order = await db
    .prepare(
      `SELECT * FROM orders
        WHERE email = ? AND status = 'paid'
        ORDER BY paid_at DESC LIMIT 1`,
    )
    .bind(email)
    .first<Order>();

  if (order) {
    const curso = getCursoServidor(order.curso_slug);
    if (curso) {
      const token = await crearTokenAcceso(db, order.id);
      await enviarCorreoAcceso(env, db, {
        order,
        curso,
        enlace: `${origin}/acceso/${token}`,
        kind: 'resend',
      });
    }
  }

  return pagina(neutra, origin);
};
