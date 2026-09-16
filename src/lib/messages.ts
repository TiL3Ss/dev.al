import { randomUUID } from 'node:crypto';
import { getTursoClient } from './turso';

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

function rowToMessage(row: MessageRow): ContactMessageRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
  };
}

/** Guarda una copia del mensaje enviado por el formulario de Contact. */
export async function logContactMessage(msg: { name: string; email: string; message: string }): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: 'INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)',
    args: [randomUUID(), msg.name, msg.email, msg.message],
  });
}

/** Trae el historial completo, más reciente primero. */
export async function getContactMessages(): Promise<ContactMessageRecord[]> {
  const client = getTursoClient();
  const result = await client.execute(
    'SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC'
  );
  return result.rows.map((r) => rowToMessage(r as unknown as MessageRow));
}

/** Borra un mensaje del historial. */
export async function deleteContactMessage(id: string): Promise<void> {
  const client = getTursoClient();
  await client.execute({ sql: 'DELETE FROM contact_messages WHERE id = ?', args: [id] });
}
