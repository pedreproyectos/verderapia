/**
 * Lógica del paywall de cursos.
 *
 * Este módulo corre SOLO en el servidor (rutas SSR / API). Nunca debe
 * importarse desde componentes de cliente: maneja secretos y hashes privados
 * de Vimeo.
 */

import cursosRaw from '../data/cursos.server.json?raw';

// ---------------------------------------------------------------------------
// Tipos mínimos de Cloudflare (evitamos depender de @cloudflare/workers-types)
// ---------------------------------------------------------------------------

export type D1Stmt = {
  bind(...values: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
};

export type D1Database = {
  prepare(sql: string): D1Stmt;
};

export type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

export type Env = {
  DB?: D1Database;
  SESSION?: KVNamespace;
  PAYMENTS_MODE?: string;
  FLOW_API_KEY?: string;
  FLOW_SECRET?: string;
  FLOW_SANDBOX?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_TOKEN?: string;
  PUBLIC_SITE_URL?: string;
};

export type CursoVideo = {
  videoId?: string;
  titulo: string;
  vimeoId?: string;
  vimeoHash?: string;
  duracionMin: number;
  descripcion?: string;
};

export type CursoParte = {
  titulo: string;
  descripcion?: string;
  videos: CursoVideo[];
};

export type Curso = {
  id: string;
  titulo: string;
  resumen?: string;
  descripcion?: string;
  precio: number;
  moneda: string;
  publicado: boolean;
  orden: number;
  portada?: string;
  previewVimeoId?: string;
  partes: CursoParte[];
};

export type Order = {
  id: string;
  curso_slug: string;
  email: string;
  nombre: string | null;
  amount_clp: number;
  currency: string;
  provider: string;
  provider_ref: string | null;
  provider_payment: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  raw: string | null;
};

export type AccessToken = {
  id: string;
  order_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  order_id: string;
  curso_slug: string;
  email: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  user_agent: string | null;
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Env de Cloudflare. Astro v6+ expone `cloudflare:workers` (no locals.runtime). */
let _cfEnv: Env | null = null;

export async function getEnv(_locals?: unknown): Promise<Env> {
  if (_cfEnv) return _cfEnv;

  try {
    // Specifier calculado para que Vite no intente resolverlo en dev (Node).
    const specifier = ['cloudflare', 'workers'].join(':');
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: Env };
    _cfEnv = (mod.env ?? {}) as Env;
  } catch {
    _cfEnv = {};
  }
  return _cfEnv;
}

export function siteUrl(env: Env): string {
  return (env.PUBLIC_SITE_URL ?? 'https://verderapia.cl').replace(/\/$/, '');
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function textResponse(text: string, status = 200, headers?: Record<string, string>): Response {
  return new Response(text, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Token aleatorio seguro para enlaces de acceso y sesiones. */
export function randomToken(bytes = 24): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64url(data);
}

export function newId(prefix = 'ord'): string {
  return `${prefix}_${Date.now().toString(36)}${randomToken(8)}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacSha256Hex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparación de strings en tiempo constante (aprox.). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ---------------------------------------------------------------------------
// Cursos (datos generados en build)
// ---------------------------------------------------------------------------

let _cursos: Curso[] | null = null;

export function getCursosServidor(): Curso[] {
  if (!_cursos) {
    _cursos = JSON.parse(cursosRaw) as Curso[];
  }
  return _cursos;
}

export function getCursoServidor(slug: string): Curso | undefined {
  return getCursosServidor().find((curso) => curso.id === slug);
}

// ---------------------------------------------------------------------------
// Órdenes, tokens y sesiones
// ---------------------------------------------------------------------------

export async function crearOrden(
  db: D1Database,
  data: {
    cursoSlug: string;
    email: string;
    nombre?: string;
    amountClp: number;
    provider: string;
    status: 'pending' | 'paid';
    providerRef?: string;
    providerPayment?: string;
    currency?: string;
    raw?: unknown;
  },
): Promise<Order> {
  const order: Order = {
    id: newId('ord'),
    curso_slug: data.cursoSlug,
    email: data.email,
    nombre: data.nombre ?? null,
    amount_clp: data.amountClp,
    currency: data.currency ?? 'CLP',
    provider: data.provider,
    provider_ref: data.providerRef ?? null,
    provider_payment: data.providerPayment ?? null,
    status: data.status,
    paid_at: data.status === 'paid' ? nowIso() : null,
    created_at: nowIso(),
    raw: data.raw ? JSON.stringify(data.raw) : null,
  };

  await db
    .prepare(
      `INSERT INTO orders
        (id, curso_slug, email, nombre, amount_clp, currency, provider,
         provider_ref, provider_payment, status, paid_at, created_at, raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      order.id,
      order.curso_slug,
      order.email,
      order.nombre,
      order.amount_clp,
      order.currency,
      order.provider,
      order.provider_ref,
      order.provider_payment,
      order.status,
      order.paid_at,
      order.created_at,
      order.raw,
    )
    .run();

  return order;
}

export async function getOrden(db: D1Database, id: string): Promise<Order | null> {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<Order>();
}

export async function getOrdenPorRef(db: D1Database, provider: string, ref: string): Promise<Order | null> {
  return db
    .prepare('SELECT * FROM orders WHERE provider = ? AND provider_ref = ? ORDER BY created_at DESC LIMIT 1')
    .bind(provider, ref)
    .first<Order>();
}

export async function marcarOrdenPagada(
  db: D1Database,
  order: Order,
  providerPayment: string,
  raw: unknown,
): Promise<void> {
  await db
    .prepare(
      `UPDATE orders
          SET status = 'paid', paid_at = ?, provider_payment = ?, raw = ?
        WHERE id = ? AND status != 'paid'`,
    )
    .bind(nowIso(), providerPayment, JSON.stringify(raw), order.id)
    .run();
}

/** Registra un evento de webhook. Devuelve false si ya existía (idempotencia). */
export async function registrarWebhook(db: D1Database, id: string): Promise<boolean> {
  const existente = await db.prepare('SELECT id FROM webhook_events WHERE id = ?').bind(id).first<{ id: string }>();
  if (existente) return false;
  await db.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').bind(id, nowIso()).run();
  return true;
}

/** Crea un token de acceso (7 días para canjear). Devuelve el token en claro. */
export async function crearTokenAcceso(
  db: D1Database,
  orderId: string,
  diasValidez = 7,
): Promise<string> {
  const token = randomToken(24);
  const hash = await sha256Hex(token);
  const expires = new Date(Date.now() + diasValidez * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare(
      `INSERT INTO access_tokens (id, order_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(newId('tok'), orderId, hash, expires, nowIso())
    .run();
  return token;
}

export async function getTokenPorValor(
  db: D1Database,
  token: string,
): Promise<AccessToken | null> {
  const hash = await sha256Hex(token);
  return db.prepare('SELECT * FROM access_tokens WHERE token_hash = ?').bind(hash).first<AccessToken>();
}

export async function crearSesion(
  db: D1Database,
  order: Order,
  userAgent: string | null,
): Promise<Session> {
  const session: Session = {
    id: randomToken(24),
    order_id: order.id,
    curso_slug: order.curso_slug,
    email: order.email,
    expires_at: null,
    revoked_at: null,
    created_at: nowIso(),
    last_seen_at: nowIso(),
    user_agent: userAgent,
  };
  await db
    .prepare(
      `INSERT INTO sessions
        (id, order_id, curso_slug, email, expires_at, revoked_at, created_at, last_seen_at, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      session.id,
      session.order_id,
      session.curso_slug,
      session.email,
      session.expires_at,
      session.revoked_at,
      session.created_at,
      session.last_seen_at,
      session.user_agent,
    )
    .run();
  return session;
}

export async function getSesion(db: D1Database, id: string): Promise<Session | null> {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<Session>();
}

export async function tocarSesion(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(nowIso(), id).run();
}

export async function revocarSesionesDeOrden(db: D1Database, orderId: string): Promise<void> {
  await db.prepare('UPDATE sessions SET revoked_at = ? WHERE order_id = ? AND revoked_at IS NULL').bind(nowIso(), orderId).run();
}

export function sesionValida(session: Session | null, cursoSlug?: string): session is Session {
  if (!session) return false;
  if (session.revoked_at) return false;
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) return false;
  if (cursoSlug && session.curso_slug !== cursoSlug) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

const FLOW_PROD = 'https://www.flow.cl/api';
const FLOW_SANDBOX = 'https://sandbox.flow.cl/api';

export function flowBase(env: Env): string {
  return env.FLOW_SANDBOX === '1' || env.FLOW_SANDBOX === 'true' ? FLOW_SANDBOX : FLOW_PROD;
}

/** Flow firma concatenando clave+valor, ordenado por clave, sin separadores. */
export function flowFirmar(params: Record<string, string>, secret: string): Promise<string> {
  const string = Object.keys(params)
    .filter((key) => key !== 's')
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');
  return hmacSha256Hex(string, secret);
}

export async function flowCrearPago(
  env: Env,
  data: {
    orderId: string;
    subject: string;
    amount: number;
    email: string;
    urlConfirmation: string;
    urlReturn: string;
  },
): Promise<{ url: string; token: string } | { error: string }> {
  if (!env.FLOW_API_KEY || !env.FLOW_SECRET) {
    return { error: 'Flow no está configurado' };
  }

  const params: Record<string, string> = {
    apiKey: env.FLOW_API_KEY,
    commerceOrder: data.orderId,
    subject: data.subject.slice(0, 120),
    currency: 'CLP',
    amount: String(data.amount),
    email: data.email,
    urlConfirmation: data.urlConfirmation,
    urlReturn: data.urlReturn,
  };
  params.s = await flowFirmar(params, env.FLOW_SECRET);

  const body = new URLSearchParams(params);
  const res = await fetch(`${flowBase(env)}/payment/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) return { error: `Flow respondió ${res.status}: ${text.slice(0, 200)}` };

  try {
    const payload = JSON.parse(text) as { url?: string; token?: string };
    if (!payload.url || !payload.token) return { error: 'Respuesta inesperada de Flow' };
    return { url: payload.url, token: payload.token };
  } catch {
    return { error: 'Respuesta inválida de Flow' };
  }
}

export type FlowStatus = {
  flowOrder?: number;
  commerceOrder?: string;
  status?: number;
  amount?: number;
  currency?: string;
  paymentData?: unknown;
};

export async function flowEstadoPago(env: Env, token: string): Promise<FlowStatus | { error: string }> {
  if (!env.FLOW_API_KEY || !env.FLOW_SECRET) return { error: 'Flow no está configurado' };

  const params: Record<string, string> = { apiKey: env.FLOW_API_KEY, token };
  const s = await flowFirmar(params, env.FLOW_SECRET);
  const qs = new URLSearchParams({ ...params, s });
  const res = await fetch(`${flowBase(env)}/payment/getStatus?${qs}`);
  const text = await res.text();
  if (!res.ok) return { error: `Flow respondió ${res.status}: ${text.slice(0, 200)}` };
  try {
    return JSON.parse(text) as FlowStatus;
  } catch {
    return { error: 'Respuesta inválida de Flow' };
  }
}

/** 1 pendiente · 2 pagada · 3 rechazada · 4 anulada */
export function flowEstadoTexto(status: number | undefined): 'pending' | 'paid' | 'rejected' | 'refunded' {
  if (status === 2) return 'paid';
  if (status === 3) return 'rejected';
  if (status === 4) return 'refunded';
  return 'pending';
}

// ---------------------------------------------------------------------------
// Correo
// ---------------------------------------------------------------------------

export async function enviarCorreoAcceso(
  env: Env,
  db: D1Database,
  data: { order: Order; curso: Curso; enlace: string; kind?: 'access' | 'resend' },
): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> {
  const from = env.EMAIL_FROM ?? 'cursos@verderapia.cl';
  const nombre = data.order.nombre?.trim();
  const saludo = nombre ? `Hola ${nombre}:` : 'Hola:';

  const texto = [
    saludo,
    '',
    `Recibimos tu pago y tu acceso al curso "${data.curso.titulo}" ya está listo.`,
    '',
    'Entra aquí para ver el curso:',
    data.enlace,
    '',
    'Este enlace es personal y vence en 7 días. Al usarlo se activa tu acceso,',
    'sin fecha de término. Puedes volver a pedir el enlace cuando quieras desde',
    `${siteUrl(env)}/acceso/`,
    '',
    'Si no reconoces esta compra, escríbenos a contacto@verderapia.cl.',
    '',
    '— Verderapia',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.6">
      <p>${saludo}</p>
      <p>Recibimos tu pago y tu acceso al curso <strong>${escapeHtml(data.curso.titulo)}</strong> ya está listo.</p>
      <p style="margin:28px 0">
        <a href="${data.enlace}" style="display:inline-block;background:#2f5d3a;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Ver el curso</a>
      </p>
      <p style="font-size:14px;color:#555">Si el botón no funciona, copia este enlace:<br>${data.enlace}</p>
      <p style="font-size:14px;color:#555">Este enlace es personal y vence en 7 días. Al usarlo se activa tu acceso, sin fecha de término. Puedes volver a pedir el enlace desde <a href="${siteUrl(env)}/acceso/">${siteUrl(env)}/acceso/</a>.</p>
      <p style="font-size:14px;color:#555">Si no reconoces esta compra, escríbenos a contacto@verderapia.cl.</p>
      <p>— Verderapia</p>
    </div>`;

  const log = async (status: 'sent' | 'skipped' | 'failed', providerId: string | null, error?: string) => {
    await db
      .prepare(
        `INSERT INTO email_log (id, order_id, kind, to_email, provider_id, status, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId('mail'), data.order.id, data.kind ?? 'access', data.order.email, providerId, status, error ?? null, nowIso())
      .run();
  };

  if (!env.RESEND_API_KEY) {
    await log('skipped', null, 'RESEND_API_KEY no configurado');
    return { status: 'skipped' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `Verderapia <${from}>`,
        to: [data.order.email],
        reply_to: 'contacto@verderapia.cl',
        subject: `Tu acceso al curso «${data.curso.titulo}»`,
        text: texto,
        html,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      await log('failed', null, `${res.status}: ${payload.message ?? 'error'}`);
      return { status: 'failed', error: `${res.status}` };
    }
    await log('sent', payload.id ?? null);
    return { status: 'sent' };
  } catch (error) {
    await log('failed', null, String(error).slice(0, 300));
    return { status: 'failed', error: String(error) };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Autenticación del panel de administración (Basic + ADMIN_TOKEN)
// ---------------------------------------------------------------------------

export function adminAutorizado(request: Request, env: Env): boolean {
  if (!env.ADMIN_TOKEN) return false;
  const expected = `Basic ${btoa(`admin:${env.ADMIN_TOKEN}`)}`;
  const received = request.headers.get('authorization') ?? '';
  return safeEqual(received, expected);
}

export function adminChallenge(): Response {
  return new Response('Autenticación requerida', {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="Verderapia admin", charset="UTF-8"' },
  });
}

// ---------------------------------------------------------------------------
// Rate limit simple con KV
// ---------------------------------------------------------------------------

export async function limitar(
  env: Env,
  clave: string,
  maximo: number,
  ventanaSegundos: number,
): Promise<boolean> {
  if (!env.SESSION) return true; // sin KV no limitamos (dev)
  const key = `rl:${clave}`;
  const actual = Number((await env.SESSION.get(key)) ?? '0');
  if (actual >= maximo) return false;
  await env.SESSION.put(key, String(actual + 1), { expirationTtl: ventanaSegundos });
  return true;
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

export function formatPrecio(precio: number, moneda = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}
