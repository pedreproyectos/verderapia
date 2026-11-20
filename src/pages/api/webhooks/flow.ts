import type { APIRoute } from 'astro';
import {
  getEnv,
  getCursoServidor,
  getOrden,
  flowEstadoPago,
  flowEstadoTexto,
  marcarOrdenPagada,
  registrarWebhook,
  crearTokenAcceso,
  enviarCorreoAcceso,
  siteUrl,
  textResponse,
} from '../../../lib/paywall';

export const prerender = false;

/**
 * Webhook de Flow. No confiamos en el payload: con el token consultamos el
 * estado real del pago a Flow y verificamos monto y orden antes de dar acceso.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const env = await getEnv(locals);
  const db = env.DB;
  if (!db) return textResponse('paywall no configurado', 503);

  let token = '';
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { token?: string };
      token = String(body?.token ?? '');
    } else {
      const form = await request.formData();
      token = String(form.get('token') ?? '');
    }
  } catch {
    return textResponse('payload inválido', 400);
  }

  if (!token) return textResponse('falta token', 400);

  const estado = await flowEstadoPago(env, token);
  if ('error' in estado) return textResponse(estado.error, 502);
  if (!estado.commerceOrder) return textResponse('falta commerceOrder', 400);

  const order = await getOrden(db, estado.commerceOrder);
  if (!order) return textResponse('orden no encontrada', 404);

  const status = flowEstadoTexto(estado.status);
  if (status !== 'paid') return textResponse('ok');

  if (Number(estado.amount) !== Number(order.amount_clp)) {
    return textResponse('monto no coincide', 400);
  }

  // Idempotencia: el mismo pago no genera dos correos ni dos accesos.
  const primeraVez = await registrarWebhook(db, `flow:${estado.flowOrder ?? token}`);
  if (!primeraVez) return textResponse('ok');

  await marcarOrdenPagada(db, order, String(estado.flowOrder ?? ''), estado);

  const curso = getCursoServidor(order.curso_slug);
  const actualizada = await getOrden(db, order.id);
  if (curso && actualizada) {
    const accessToken = await crearTokenAcceso(db, actualizada.id);
    await enviarCorreoAcceso(env, db, {
      order: actualizada,
      curso,
      enlace: `${siteUrl(env)}/acceso/${accessToken}`,
    });
  }

  return textResponse('ok');
};
