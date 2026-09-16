import type { APIRoute } from 'astro';
import { getProjects, upsertProject, deleteProject, type Project } from '../../lib/projects';
import { SESSION_COOKIE, isValidSession } from '../../lib/auth';

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado. Iniciá sesión en /sysadmin.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/projects — lista los proyectos guardados en Turso (pública,
// de solo lectura)
export const GET: APIRoute = async () => {
  try {
    const projects = await getProjects();
    return new Response(JSON.stringify({ projects }), {
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

// POST /api/projects — ingresa (o actualiza) un proyecto. Requiere sesión
// de /sysadmin (cookie SESSION_COOKIE).
// Body esperado (JSON): { id, title, description, logo, logoAlt, techs: string[], link?, sortOrder? }
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) return unauthorized();
  try {
    const body = await request.json();

    const required = ['id', 'title', 'description', 'logo', 'logoAlt', 'techs'];
    for (const field of required) {
      if (!body[field]) {
        return new Response(JSON.stringify({ error: `Falta el campo requerido: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    if (!Array.isArray(body.techs)) {
      return new Response(JSON.stringify({ error: '"techs" debe ser un array de strings' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const project: Project = {
      id: String(body.id),
      title: String(body.title),
      description: String(body.description),
      logo: String(body.logo),
      logoAlt: String(body.logoAlt),
      techs: body.techs.map(String),
      link: body.link ? String(body.link) : undefined,
    };

    await upsertProject(project, typeof body.sortOrder === 'number' ? body.sortOrder : 0);

    return new Response(JSON.stringify({ ok: true, project }), {
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

// DELETE /api/projects?id=proj-1 — borra un proyecto. Requiere sesión.
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
    await deleteProject(id);
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
