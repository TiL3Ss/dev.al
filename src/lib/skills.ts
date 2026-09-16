import { getTursoClient } from './turso';

export interface Skill {
  id: string;
  category: string;
  name: string;
  rank: number; // 1..10
  sortOrder: number;
}

interface SkillRow {
  id: string;
  category: string;
  name: string;
  rank: number;
  sort_order: number;
}

function rowToSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    rank: row.rank,
    sortOrder: row.sort_order,
  };
}

/** Trae todos los skills, ordenados por categoría y sort_order. */
export async function getSkills(): Promise<Skill[]> {
  const client = getTursoClient();
  const result = await client.execute(
    'SELECT id, category, name, rank, sort_order FROM skills ORDER BY category ASC, sort_order ASC'
  );
  return result.rows.map((r) => rowToSkill(r as unknown as SkillRow));
}

/** Agrupa los skills por categoría, en el mismo formato que usa Tecs.astro. */
export function groupSkillsByCategory(skills: Skill[]): { subtitle: string; techs: { name: string; rank: number }[] }[] {
  const map = new Map<string, { name: string; rank: number }[]>();
  for (const s of skills) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push({ name: s.name, rank: s.rank });
  }
  return Array.from(map.entries()).map(([subtitle, techs]) => ({ subtitle, techs }));
}

/** Inserta o reemplaza un skill (usado por POST /api/skills). */
export async function upsertSkill(s: Skill): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO skills (id, category, name, rank, sort_order)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category   = excluded.category,
            name       = excluded.name,
            rank       = excluded.rank,
            sort_order = excluded.sort_order`,
    args: [s.id, s.category, s.name, s.rank, s.sortOrder],
  });
}

/** Borra un skill por id (usado por DELETE /api/skills). */
export async function deleteSkill(id: string): Promise<void> {
  const client = getTursoClient();
  await client.execute({ sql: 'DELETE FROM skills WHERE id = ?', args: [id] });
}
