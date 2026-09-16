import type { APIRoute } from 'astro';
import { getContactMessages, deleteContactMessage } from '../../lib/messages';
import { SESSION_COOKIE, isValidSession } from '../../lib/auth';

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado. Iniciá sesión en /sysadmin.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/messages — historial de mensajes del formulario de Contact.
// Requiere sesión (son datos privados de quienes escribieron).
export const GET: APIRoute = async ({ cookies }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) return unauthorized();
  try {
    const messages = await getContactMessages();
    return new Response(JSON.stringify({ messages }), {
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

// DELETE /api/messages?id=... — borra un mensaje del historial.
export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro "id".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await deleteContactMessage(id);
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
