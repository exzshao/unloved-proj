export const dynamic = 'force-dynamic';
import { sendOtp } from '@/lib/otp';
import { toE164 } from '@/lib/validation';
import { json, badRequest } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) return badRequest('phone required');
    const e164 = toE164(phone);
    await sendOtp(e164);
    return json({ ok: true });
  } catch (e: any) {
    return badRequest(e.message || 'failed to send otp', 400);
  }
}
