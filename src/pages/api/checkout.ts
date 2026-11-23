import type { APIRoute } from 'astro';
import {
  getEnv,
  getCursoServidor,
  crearOrden,
  crearTokenAcceso,
  enviarCorreoAcceso,
  enviarCorreoTransferencia,
  getOrdenPendienteTransferencia,
  flowCrearPago,
  jsonResponse,
  limitar,
  isValidEmail,
  normalizeEmail,
  siteUrl,
} from '../../lib/paywall';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = await getEnv(locals);
  const db = env.DB;

  if (!db) {
    return jsonResponse({ error: 'El sistema de pagos aún no está configurado.' }, 503);
  }

  let body: {
    cursoSlug?: string;
    email?: string;
    nombre?: string;
    metodo?: string;
  } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Solicitud inválida.' }, 400);
  }

  const cursoSlug = String(body?.cursoSlug ?? '').trim();
  const email = normalizeEmail(body?.email);
  const nombre = String(body?.nombre ?? '').trim().slice(0, 120);
  const metodo = body?.metodo === 'transferencia' ? 'transferencia' : 'flow';

  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Escribe un correo válido.' }, 400);
  }

  const curso = getCursoServidor(cursoSlug);
  if (!curso || !curso.publicado) {
    return jsonResponse({ error: 'Curso no encontrado.' }, 404);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'local';
  const permitido = await limitar(env, `checkout:${ip}`, 10, 600);
  if (!permitido) {
    return jsonResponse({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
  }

  const origin = siteUrl(env);
  const modoDemo = env.PAYMENTS_MODE === 'demo';

  // Transferencia bancaria: registra la orden como pendiente y envía por correo
  // los datos para transferir. El acceso se libera al confirmarla en el panel.
  if (metodo === 'transferencia') {
    const order =
      (await getOrdenPendienteTransferencia(db, curso.id, email)) ??
      (await crearOrden(db, {
        cursoSlug: curso.id,
        email,
        nombre,
        amountClp: curso.precio,
        provider: 'transferencia',
        status: 'pending',
        raw: { metodo: 'transferencia' },
      }));

    const envio = await enviarCorreoTransferencia(env, db, { order, curso });

    return jsonResponse({
      metodo: 'transferencia',
      orderId: order.id,
      monto: curso.precio,
      moneda: curso.moneda,
      correo: envio.status,
    });
  }

  // Modo demo: no cobra, crea la orden pagada y entrega el enlace directamente.
  // Solo se activa si el administrador define PAYMENTS_MODE=demo.
  if (modoDemo) {
    const order = await crearOrden(db, {
      cursoSlug: curso.id,
      email,
      nombre,
      amountClp: curso.precio,
      provider: 'demo',
      status: 'paid',
    });
    const token = await crearTokenAcceso(db, order.id);
    const enlace = `${origin}/acceso/${token}`;
    await enviarCorreoAcceso(env, db, { order, curso, enlace });
    return jsonResponse({ redirect: enlace, demo: true });
  }

  if (!env.FLOW_API_KEY || !env.FLOW_SECRET) {
    return jsonResponse(
      {
        error:
          'El pago online todavía no está habilitado. Puedes pagar por transferencia bancaria o escríbenos por WhatsApp.',
      },
      503,
    );
  }

  const order = await crearOrden(db, {
    cursoSlug: curso.id,
    email,
    nombre,
    amountClp: curso.precio,
    provider: 'flow',
    status: 'pending',
  });

  const pago = await flowCrearPago(env, {
    orderId: order.id,
    subject: curso.titulo,
    amount: curso.precio,
    email,
    urlConfirmation: `${origin}/api/webhooks/flow`,
    urlReturn: `${origin}/api/pagos/retorno`,
  });

  if ('error' in pago) {
    return jsonResponse(
      { error: 'No pudimos iniciar el pago. Intenta nuevamente o escríbenos por WhatsApp.' },
      502,
    );
  }

  return jsonResponse({ redirect: `${pago.url}?token=${encodeURIComponent(pago.token)}` });
};
