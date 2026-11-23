import type { APIRoute } from 'astro';
import {
  adminAutorizado,
  adminChallenge,
  crearOrden,
  crearTokenAcceso,
  enviarCorreoAcceso,
  getCursoServidor,
  getEnv,
  getOrden,
  isValidEmail,
  marcarOrdenPagada,
  normalizeEmail,
  revocarSesionesDeOrden,
  siteUrl,
  type Order,
} from '../../../lib/paywall';

export const prerender = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paginaEnlace(titulo: string, enlace: string | null, detalle: string, correo?: string): Response {
  const cuerpo = enlace
    ? `<p>${escapeHtml(detalle)}</p>
       <p class="link"><a href="${enlace}">${enlace}</a></p>
       <p class="nota">Cópialo y envíalo al comprador. El enlace vence en 7 días; el acceso, no.</p>`
    : `<p>${escapeHtml(detalle)}</p>`;

  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <meta name="robots" content="noindex">
     <title>${escapeHtml(titulo)} — Verderapia</title>
     <style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f1e9;color:#222;padding:2rem 1.2rem}
     .caja{max-width:560px;margin:2rem auto;background:#fff;border:1px solid #e2ddcf;border-radius:16px;padding:1.6rem}
     h1{font-size:1.2rem;margin:0 0 .8rem}.link{word-break:break-all;background:#f6f3ea;border:1px solid #e2ddcf;border-radius:10px;padding:.8rem}
     .link a{color:#2f5d3a;font-weight:700}.nota{color:#666;font-size:.85rem}
     .volver{display:inline-block;margin-top:1rem;font-weight:700;color:#2f5d3a}</style>
     </head><body><div class="caja"><h1>${escapeHtml(titulo)}</h1>${cuerpo}
     ${correo ? `<p class="nota">Correo: ${escapeHtml(correo)}</p>` : ''}
     <a class="volver" href="/admin/ordenes">← Volver al panel</a></div></body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = await getEnv(locals);
  if (!adminAutorizado(request, env)) return adminChallenge();

  const db = env.DB;
  if (!db) return new Response('Sin base de datos', { status: 503 });

  const form = await request.formData();
  const accion = String(form.get('accion') ?? '');
  const orderId = String(form.get('order_id') ?? '');

  const order = orderId ? await getOrden(db, orderId) : null;

  if (accion === 'revoke' && order) {
    await revocarSesionesDeOrden(db, order.id);
    return redirect('/admin/ordenes?ok=revocado');
  }

  if (accion === 'resend' && order) {
    const curso = getCursoServidor(order.curso_slug);
    if (curso && order.status === 'paid') {
      const token = await crearTokenAcceso(db, order.id);
      await enviarCorreoAcceso(env, db, {
        order: order as Order,
        curso,
        enlace: `${siteUrl(env)}/acceso/${token}`,
        kind: 'resend',
      });
      return redirect('/admin/ordenes?ok=enviado');
    }
    return redirect('/admin/ordenes?error=orden');
  }

  // Genera un enlace nuevo para una orden pagada (sin enviar correo).
  if (accion === 'link' && order && order.status === 'paid') {
    const token = await crearTokenAcceso(db, order.id);
    return paginaEnlace(
      'Enlace de acceso',
      `${siteUrl(env)}/acceso/${token}`,
      `Enlace nuevo para ${order.email}.`,
      order.email,
    );
  }

  // Confirmar una orden pendiente (transferencia u otro medio fuera de la
  // pasarela): la marca como pagada y envía el enlace de acceso.
  if (accion === 'confirmar' && order && order.status !== 'paid') {
    await marcarOrdenPagada(db, order, `admin:${order.id}`, {
      confirmadoPor: 'admin',
      confirmadoEn: new Date().toISOString(),
    });

    const curso = getCursoServidor(order.curso_slug);
    const actualizada = await getOrden(db, order.id);
    if (curso && actualizada) {
      const token = await crearTokenAcceso(db, actualizada.id);
      await enviarCorreoAcceso(env, db, {
        order: actualizada as Order,
        curso,
        enlace: `${siteUrl(env)}/acceso/${token}`,
      });
    }

    return redirect('/admin/ordenes?ok=pagado');
  }

  // Acceso manual: se usa cuando el pago se recibe por efectivo, WhatsApp u
  // otro medio y no pasa por el sitio.
  if (accion === 'manual') {
    const email = normalizeEmail(form.get('email'));
    const cursoSlug = String(form.get('curso') ?? '');
    const nombre = String(form.get('nombre') ?? '').trim().slice(0, 120);
    const curso = getCursoServidor(cursoSlug);

    if (!isValidEmail(email) || !curso) {
      return paginaEnlace('No se pudo crear el acceso', null, 'Revisa el curso y el correo.');
    }

    const nueva = await crearOrden(db, {
      cursoSlug: curso.id,
      email,
      nombre,
      amountClp: curso.precio,
      provider: 'manual',
      status: 'paid',
      raw: { creadoPor: 'admin', accion: 'manual' },
    });
    const token = await crearTokenAcceso(db, nueva.id);
    const enlace = `${siteUrl(env)}/acceso/${token}`;
    const envio = await enviarCorreoAcceso(env, db, { order: nueva, curso, enlace });

    return paginaEnlace(
      'Acceso creado',
      enlace,
      envio.status === 'sent'
        ? `Acceso creado y correo enviado a ${email}.`
        : `Acceso creado para ${email}. El correo no se envió (${envio.status}); copia el enlace y envíalo tú.`,
      email,
    );
  }

  return redirect('/admin/ordenes');
};
