import type { APIRoute } from 'astro';
import {
  adminAutorizado,
  adminChallenge,
  crearTokenAcceso,
  enviarCorreoAcceso,
  getCursoServidor,
  getEnv,
  getOrden,
  revocarSesionesDeOrden,
  siteUrl,
  type Order,
} from '../../../lib/paywall';

export const prerender = false;

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

  return redirect('/admin/ordenes');
};
