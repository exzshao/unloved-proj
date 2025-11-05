import { Pool, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    pool = new Pool({ connectionString: url, max: 5, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) {
  const client = await getDb().connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
