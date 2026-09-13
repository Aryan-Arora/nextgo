import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Self-contained RFC 4226 (HOTP) / RFC 6238 (TOTP) implementation — 6-digit
// codes, 30-second step, SHA-1 (the standard every authenticator app
// assumes; Google Authenticator, Authy, 1Password all default to it).
// No third-party TOTP package: the algorithm is ~30 lines and correctness
// here is easy to verify by hand, which matters more than saving the lines.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

export function generateTotpSecret(): string {
  const bytes = randomBytes(20); // 160 bits, the RFC 4226 recommendation
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let secret = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) secret += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return secret;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) bits += BASE32_ALPHABET.indexOf(char).toString(2).padStart(5, '0');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: bigint): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const hmac = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

// Accepts the current step and one step of clock drift on either side —
// tight enough to matter, loose enough that a slightly-off phone clock
// doesn't lock an admin out.
export function verifyTotpCode(secret: string, code: string, atMs = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secret);
  const counter = BigInt(Math.floor(atMs / 1000 / STEP_SECONDS));
  for (const drift of [0n, -1n, 1n]) {
    const expected = hotp(key, counter + drift);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return true;
  }
  return false;
}

export function totpOtpauthUri(secret: string, accountLabel: string): string {
  return `otpauth://totp/NEXGO:${encodeURIComponent(accountLabel)}?secret=${secret}&issuer=NEXGO&digits=${DIGITS}&period=${STEP_SECONDS}`;
}
