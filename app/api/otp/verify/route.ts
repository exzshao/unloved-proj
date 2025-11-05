export const dynamic = 'force-dynamic';
import { checkOtp } from '@/lib/otp';
import { toE164 } from '@/lib/validation';
import { json, badRequest } from '@/lib/http';
import { hashPhone, last4 } from '@/lib/crypto';
import { query } from '@/lib/db';
import { setSession } from '@/lib/session';

export async function POST(req: Request) {
  const headers = new Headers();
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) return badRequest('phone and code required');
    const e164 = toE164(phone);
    const res = await checkOtp(e164, code);
    if ((res as any).status !== 'approved') return badRequest('invalid code', 401);

    const pHash = hashPhone(e164);
    const pLast4 = last4(e164);

    const existing = await query<{ id: number }>('SELECT id FROM users WHERE phone_hash=$1', [pHash]);
    let uid = existing[0]?.id;
    if (!uid) {
      const inserted = await query<{ id: number }>('INSERT INTO users (phone_hash, phone_last4) VALUES ($1,$2) RETURNING id', [pHash, pLast4]);
      uid = inserted[0].id;
    }

    await setSession(headers, uid);
    return json({ ok: true }, { headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'verify failed' }), { status: 400, headers });
  }
}
