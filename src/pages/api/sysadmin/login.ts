import type { APIRoute } from 'astro';
import { SESSION_COOKIE, verifyCode, makeSessionValue } from '../../../lib/auth';

export const prerender = false;

// POST /api/sysadmin/login — body: { code }
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const code = String(body?.code ?? '');

    if (!verifyCode(code)) {
      return new Response(JSON.stringify({ error: 'Código incorrecto.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    cookies.set(SESSION_COOKIE, makeSessionValue(), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 horas
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
