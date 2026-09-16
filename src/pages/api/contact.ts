import type { APIRoute } from 'astro';
import { sendContactEmail } from '../../lib/mailer';
import { logContactMessage } from '../../lib/messages';

export const prerender = false;

// POST /api/contact — recibe el formulario de Contacts, envía el correo
// y guarda una copia en el historial (tabla contact_messages).
// Body esperado (JSON): { name, email, message }
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, message } = body ?? {};

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: name, email y message son requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(email))) {
      return new Response(JSON.stringify({ error: 'El email no es válido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanMsg = {
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      message: String(message).slice(0, 5000),
    };

    await sendContactEmail(cleanMsg);

    // El historial es una funcionalidad extra del panel /sysadmin — si
    // falla el guardado (Turso caído, etc.) no debe tumbar el envío del
    // correo, que es lo que le importa a quien llena el formulario.
    try {
      await logContactMessage(cleanMsg);
    } catch (logErr) {
      console.error('[contact] No se pudo guardar en el historial:', logErr);
    }

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
