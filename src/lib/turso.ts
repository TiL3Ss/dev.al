import { createClient, type Client } from '@libsql/client';

// Cliente singleton — evita abrir una conexión nueva en cada request
// durante desarrollo (hot reload) o en funciones serverless reutilizadas.
let client: Client | undefined;

export function getTursoClient(): Client {
  if (client) return client;

  const url = import.meta.env.TURSO_DATABASE_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'Falta TURSO_DATABASE_URL.'
    );
  }

  client = createClient({
    url,
    // authToken es opcional solo si usas un archivo local (file:./local.db)
    authToken,
  });

  return client;
}
