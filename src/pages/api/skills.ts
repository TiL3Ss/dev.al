import type { APIRoute } from 'astro';
import { getSkills, upsertSkill, deleteSkill, type Skill } from '../../lib/skills';
import { SESSION_COOKIE, isValidSession } from '../../lib/auth';

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado. Iniciá sesión en /sysadmin.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/skills — lista los skills guardados en Turso (pública, de
// solo lectura)
export const GET: APIRoute = async () => {
  try {
    const skills = await getSkills();
    return new Response(JSON.stringify({ skills }), {
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

// POST /api/skills — ingresa (o actualiza) un skill. Requiere sesión.
// Body esperado (JSON): { id, category, name, rank, sortOrder? }
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) return unauthorized();
  try {
    const body = await request.json();

    const required = ['id', 'category', 'name', 'rank'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return new Response(JSON.stringify({ error: `Falta el campo requerido: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    const rank = Number(body.rank);
    if (!Number.isFinite(rank) || rank < 1 || rank > 10) {
      return new Response(JSON.stringify({ error: '"rank" debe ser un número entre 1 y 10' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const skill: Skill = {
      id: String(body.id),
      category: String(body.category),
      name: String(body.name),
      rank,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    };

    await upsertSkill(skill);

    return new Response(JSON.stringify({ ok: true, skill }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/skills?id=skill-1 — borra un skill. Requiere sesión.
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
    await deleteSkill(id);
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
