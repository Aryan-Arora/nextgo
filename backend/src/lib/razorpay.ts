import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

export type RazorpayOrder = { id: string; amountPaise: number; currency: 'INR'; keyId: string };

const live = Boolean(config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET);

// Mirrors the mock-courier-adapter pattern: no live keys configured means a
// deterministic local order, so the full recharge -> webhook -> ledger-credit
// flow is testable end to end without a real Razorpay sandbox account. Real
// keys switch this to actual Orders API calls with no code changes upstream.
export async function createRazorpayOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  if (!live) {
    const digest = createHash('sha256').update(`mock-order:${receipt}:${amountPaise}`).digest('hex').toUpperCase();
    return { id: `order_mock_${digest.slice(0, 18)}`, amountPaise, currency: 'INR', keyId: 'rzp_mock_key' };
  }
  const auth = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!response.ok) throw Object.assign(new Error(`Razorpay order creation failed: ${response.status}`), { statusCode: 502 });
  const body = (await response.json()) as { id: string };
  return { id: body.id, amountPaise, currency: 'INR', keyId: config.RAZORPAY_KEY_ID! };
}

// In mock mode there is no real Razorpay signing this payload, so the local
// webhook sender signs it with the same dev secret we verify against —
// the signature check itself still runs for real, only the signer differs.
export function signMockWebhook(rawBody: string): string {
  return createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = Buffer.from(createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex'), 'hex');
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export const razorpayIsLive = live;
