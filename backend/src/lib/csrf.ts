import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

const CSRF_COOKIE = 'nx_csrf';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Double-submit cookie CSRF defense, layered on top of (not instead of)
// SameSite=Lax cookies. Lax already blocks the classic cross-site-fetch
// CSRF case, but browser SameSite behavior on top-level navigations and
// older browsers is inconsistent enough that AGENT.md calls for this as an
// explicit second layer. Issued alongside every session cookie; every
// mutating request must echo it back in a header, which a cross-site page
// cannot read (that's the whole mechanism — no server-side token storage
// needed).
export function issueCsrfCookie(reply: FastifyReply) {
  const token = randomBytes(24).toString('base64url');
  reply.setCookie(CSRF_COOKIE, token, { httpOnly: false, sameSite: 'lax', secure: config.NODE_ENV === 'production', path: '/' });
  return token;
}

export function clearCsrfCookie(reply: FastifyReply) {
  reply.clearCookie(CSRF_COOKIE, { path: '/' });
}

// Webhook routes (Razorpay/couriers) are exempt by construction — they never
// carry a session cookie, so there is no session to forge a request against,
// and they're authenticated by HMAC signature instead.
export function requireCsrfHeader(request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) {
  if (!MUTATING_METHODS.has(request.method) || request.url.startsWith('/v1/webhooks/')) return done();
  if (!request.cookies.nx_session) return done(); // no session cookie => nothing to forge
  const cookieToken = request.cookies[CSRF_COOKIE];
  const headerToken = request.headers['x-csrf-token'];
  if (!cookieToken || typeof headerToken !== 'string') {
    reply.code(403).send({ error: 'CSRF_TOKEN_MISSING' });
    return;
  }
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    reply.code(403).send({ error: 'CSRF_TOKEN_INVALID' });
    return;
  }
  done();
}
