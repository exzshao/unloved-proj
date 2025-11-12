export const dynamic = 'force-dynamic';
import { json } from '@/lib/http';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const uid = await getSession(req);
  if (!uid) return new Response('Unauthorized', { status: 401 });

  const match = await query<{ matched_at: string; user_a: number; user_b: number }>(
    `SELECT matched_at, user_a, user_b FROM matches WHERE (user_a=$1 OR user_b=$1) ORDER BY matched_at DESC LIMIT 1`,
    [uid]
  );

  if (match[0]) {
    // Find the other user in the match
    const otherUserId = match[0].user_a === uid ? match[0].user_b : match[0].user_a;
    
    // Get both users' phone hashes
    const currentUser = await query<{ phone_hash: string }>('SELECT phone_hash FROM users WHERE id=$1', [uid]);
    const otherUser   = await query<{ phone_hash: string }>('SELECT phone_hash FROM users WHERE id=$1', [otherUserId]);
    const currentHash = currentUser[0]?.phone_hash;
    const otherHash   = otherUser[0]?.phone_hash;
  
    // Determine the submissions that actually participated in this match:
    // We take the last submissions from each side at or before matched_at, targeting the other's phone hash.
    const mySubmissionAtMatch = await query<{ created_at: string }>(
      'SELECT created_at FROM submissions WHERE user_id=$1 AND target_hash=$2 AND created_at <= $3 ORDER BY created_at DESC LIMIT 1',
      [uid, otherHash, match[0].matched_at]
    );
    const otherSubmissionAtMatch = await query<{ created_at: string }>(
      'SELECT created_at FROM submissions WHERE user_id=$1 AND target_hash=$2 AND created_at <= $3 ORDER BY created_at DESC LIMIT 1',
      [otherUserId, currentHash, match[0].matched_at]
    );
    
    return json({ 
      state: 'matched', 
      matchedAt: match[0].matched_at,
      submittedAt: mySubmissionAtMatch[0]?.created_at || null,
      otherEnteredAt: otherSubmissionAtMatch[0]?.created_at || null
    });
  }
  
  // Return submission timestamp for timer
  const submission = await query<{ created_at: string }>(
    'SELECT created_at FROM submissions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',
    [uid]
  );
  
  return json({ 
    state: 'waiting', 
    submittedAt: submission[0]?.created_at 
  });
}
