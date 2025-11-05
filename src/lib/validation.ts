import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

export function toE164(input: string) {
  const trimmed = (input || '').trim();
  const guess = parsePhoneNumberFromString(trimmed, 'US');
  if (guess && guess.isValid()) return guess.number; // E.164
  // Try adding plus if missing
  const tryPlus = parsePhoneNumberFromString('+' + trimmed.replace(/[^\d]/g, ''), 'US');
  if (tryPlus && tryPlus.isValid()) return tryPlus.number;
  throw new Error('Invalid phone number');
}
