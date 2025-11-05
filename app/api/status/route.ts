export const dynamic = 'force-dynamic';
import { json } from '@/lib/http';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const uid = await getSession(req);
  if (!uid) return new Response('Unauthorized', { status: 401 });

  const match = await query<{ matched_at: string }>(
    `SELECT matched_at FROM matches WHERE (user_a=$1 OR user_b=$1) ORDER BY matched_at DESC LIMIT 1`,
    [uid]
  );

  if (match[0]) return json({ state: 'matched', matchedAt: match[0].matched_at });
  return json({ state: 'waiting' });
}
