export const dynamic = 'force-dynamic';
import { json, badRequest } from '@/lib/http';
import { getSession } from '@/lib/session';
import { toE164 } from '@/lib/validation';
import { hashPhone } from '@/lib/crypto';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const uid = await getSession(req);
    if (!uid) return badRequest('unauthorized', 401);
    const { target_phone } = await req.json();
    if (!target_phone) return badRequest('target_phone required');
    const tE164 = toE164(target_phone);
    const tHash = hashPhone(tE164);

    // One active submission per user: delete older rows
    await query('DELETE FROM submissions WHERE user_id=$1', [uid]);
    await query('INSERT INTO submissions (user_id, target_hash) VALUES ($1,$2)', [uid, tHash]);

    // Check reciprocal
    const reciprocal = await query<{ user_id: number }>(
      'SELECT user_id FROM submissions WHERE user_id != $1 AND target_hash = (SELECT phone_hash FROM users WHERE id=$1)',
      [uid]
    );

    if (reciprocal[0]) {
      const other = reciprocal[0].user_id;
      const pair = [uid, other].sort((a, b) => a - b);
      try {
        await query('INSERT INTO matches (user_a, user_b) VALUES ($1,$2) ON CONFLICT DO NOTHING', pair);
      } catch {}
    }

    return json({ ok: true });
  } catch (e: any) {
    return badRequest(e.message || 'submission failed');
  }
}
