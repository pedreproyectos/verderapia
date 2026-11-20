import type { APIRoute } from 'astro';
import { getEnv, nowIso } from '../../lib/paywall';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  const env = await getEnv(locals);
  const sessionId = cookies.get('vp_session')?.value;

  if (sessionId && env.DB) {
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').bind(nowIso(), sessionId).run();
  }

  cookies.delete('vp_session', { path: '/' });
  return redirect('/');
};
