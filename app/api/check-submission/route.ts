export const dynamic = 'force-dynamic';
import { json } from '@/lib/http';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const uid = await getSession(req);
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const submission = await query<{ id: number }>(
      'SELECT id FROM submissions WHERE user_id=$1 LIMIT 1',
      [uid]
    );

    return json({ has_submission: submission.length > 0 });
  } catch (e: any) {
    console.error('check-submission error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Database error' }), { status: 500 });
  }
}

