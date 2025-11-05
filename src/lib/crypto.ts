import crypto from 'crypto';

const PEPPER = 'phone-pepper-v1';

export function hashPhone(e164: string) {
  const h = crypto.createHash('sha256');
  h.update(PEPPER);
  h.update(e164);
  return h.digest('hex');
}

export function last4(e164: string) {
  const digits = e164.replace(/\D/g, '');
  return digits.slice(-4);
}
