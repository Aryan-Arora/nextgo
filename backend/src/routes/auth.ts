import type { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { z } from 'zod';
import { config } from '../config.js';
import { withTransaction } from '../db/client.js';
import { slugify } from '../lib/slug.js';
import { hashSessionToken, newSessionToken } from '../lib/session.js';

const signupSchema = z.object({ businessName: z.string().trim().min(3).max(120), fullName: z.string().trim().min(2).max(100), email: z.string().email().max(254), password: z.string().min(12).max(200) });
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });

const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: config.NODE_ENV === 'production', path: '/', maxAge: config.SESSION_TTL_DAYS * 24 * 60 * 60 };

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/signup', async (request, reply) => {
    const input = signupSchema.parse(request.body);
    const token = newSessionToken();
    const session = await withTransaction(async (client) => {
      const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [input.email.toLowerCase()]);
      if (existing.rowCount) return null;
      const baseSlug = slugify(input.businessName) || 'seller';
      const seller = await client.query<{ id: string; slug: string }>('INSERT INTO sellers (legal_name, slug, state) VALUES ($1, $2 || \'-\' || substr(gen_random_uuid()::text, 1, 8), \'onboarding\') RETURNING id, slug', [input.businessName, baseSlug]);
      const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
      const user = await client.query<{ id: string }>('INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id', [input.email.toLowerCase(), passwordHash, input.fullName]);
      await client.query('INSERT INTO seller_memberships (seller_id, user_id, role) VALUES ($1, $2, \'owner\')', [seller.rows[0].id, user.rows[0].id]);
      const created = await client.query<{ id: string; expires_at: string }>('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 || \' days\')::interval) RETURNING id, expires_at', [user.rows[0].id, hashSessionToken(token), String(config.SESSION_TTL_DAYS)]);
      await client.query('INSERT INTO audit_events (seller_id, actor_user_id, action, target_type, target_id, request_id) VALUES ($1, $2, \'seller.created\', \'seller\', $1::text, $3)', [seller.rows[0].id, user.rows[0].id, request.id]);
      return { seller: seller.rows[0], userId: user.rows[0].id, session: created.rows[0] };
    });
    if (!session) return reply.code(409).send({ error: 'EMAIL_ALREADY_REGISTERED' });
    reply.setCookie('nx_session', token, cookieOptions);
    return reply.code(201).send({ seller: session.seller, userId: session.userId, expiresAt: session.session.expires_at });
  });

  app.post('/v1/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await withTransaction(async (client) => {
      const found = await client.query<{ id: string; password_hash: string; seller_id: string; role: string; state: string }>('SELECT u.id, u.password_hash, m.seller_id, m.role, s.state FROM users u JOIN seller_memberships m ON m.user_id = u.id JOIN sellers s ON s.id = m.seller_id WHERE u.email = $1', [input.email.toLowerCase()]);
      const account = found.rows[0];
      if (!account || account.state === 'suspended' || !(await argon2.verify(account.password_hash, input.password))) return null;
      const token = newSessionToken();
      const created = await client.query<{ expires_at: string }>('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 || \' days\')::interval) RETURNING expires_at', [account.id, hashSessionToken(token), String(config.SESSION_TTL_DAYS)]);
      return { token, expiresAt: created.rows[0].expires_at, sellerId: account.seller_id, role: account.role };
    });
    if (!result) return reply.code(401).send({ error: 'INVALID_CREDENTIALS' });
    reply.setCookie('nx_session', result.token, cookieOptions);
    return { sellerId: result.sellerId, role: result.role, expiresAt: result.expiresAt };
  });

  app.post('/v1/auth/logout', async (request, reply) => {
    const token = request.cookies.nx_session;
    if (token) await withTransaction((client) => client.query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [hashSessionToken(token)]));
    reply.clearCookie('nx_session', { path: '/' });
    return reply.code(204).send();
  });
}
