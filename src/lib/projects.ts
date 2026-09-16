import { getTursoClient } from './turso';

export interface Project {
  id: string;
  title: string;
  description: string;
  logo: string;
  logoAlt: string;
  techs: string[];
  link?: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  logo: string;
  logo_alt: string;
  techs: string; // JSON array como texto
  link: string | null;
  sort_order: number;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    logo: row.logo,
    logoAlt: row.logo_alt,
    techs: JSON.parse(row.techs),
    link: row.link ?? undefined,
  };
}

/** Trae todos los proyectos ordenados por sort_order. */
export async function getProjects(): Promise<Project[]> {
  const client = getTursoClient();
  const result = await client.execute(
    'SELECT id, title, description, logo, logo_alt, techs, link, sort_order FROM projects ORDER BY sort_order ASC'
  );
  return result.rows.map((r) => rowToProject(r as unknown as ProjectRow));
}

/** Inserta o reemplaza un proyecto (usado por POST /api/projects). */
export async function upsertProject(p: Project, sortOrder = 0): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO projects (id, title, description, logo, logo_alt, techs, link, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            logo = excluded.logo,
            logo_alt = excluded.logo_alt,
            techs = excluded.techs,
            link = excluded.link,
            sort_order = excluded.sort_order`,
    args: [
      p.id,
      p.title,
      p.description,
      p.logo,
      p.logoAlt,
      JSON.stringify(p.techs),
      p.link ?? null,
      sortOrder,
    ],
  });
}

/** Borra un proyecto por id (usado por DELETE /api/projects). */
export async function deleteProject(id: string): Promise<void> {
  const client = getTursoClient();
  await client.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
}
