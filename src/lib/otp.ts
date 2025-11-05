import twilio from 'twilio';

export async function sendOtp(e164: string) {
  if (process.env.MOCK_OTP === 'true') {
    return { sid: 'mock', channel: 'sms' } as any;
  }
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    throw new Error('Twilio env not set and MOCK_OTP!=true');
  }
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const res = await client.verify.v2.services(TWILIO_VERIFY_SID).verifications.create({ to: e164, channel: 'sms' });
  return res;
}

export async function checkOtp(e164: string, code: string) {
  if (process.env.MOCK_OTP === 'true') {
    if (code === '000000') return { status: 'approved' } as any;
    return { status: 'denied' } as any;
  }
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    throw new Error('Twilio env not set and MOCK_OTP!=true');
  }
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const res = await client.verify.v2.services(TWILIO_VERIFY_SID).verificationChecks.create({ to: e164, code });
  return res;
}
