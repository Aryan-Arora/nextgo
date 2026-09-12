import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { hashSessionToken } from '../lib/session.js';

type AdminPrincipal = { userId: string; role: string };
declare module 'fastify' { interface FastifyRequest { adminPrincipal?: AdminPrincipal } }

async function requirePlatformAdmin(request: FastifyRequest) {
  const token = request.cookies.nx_session;
  if (!token) throw Object.assign(new Error('Platform administrator authentication required'), { statusCode: 401 });
  const result = await db.query<AdminPrincipal>('SELECT pa.user_id AS "userId", pa.role FROM sessions se JOIN platform_admins pa ON pa.user_id = se.user_id WHERE se.token_hash = $1 AND se.revoked_at IS NULL AND se.expires_at > now() LIMIT 1', [hashSessionToken(token)]);
  if (!result.rows[0]) throw Object.assign(new Error('Platform administrator authentication required'), { statusCode: 403 });
  request.adminPrincipal = result.rows[0];
}

export async function adminRoutes(app: FastifyInstance) {
  app.get('/v1/admin/me', { preHandler: requirePlatformAdmin }, async (request) => ({ userId: request.adminPrincipal!.userId, role: request.adminPrincipal!.role }));

  // This is deliberately cross-tenant and therefore only exists behind the
  // separate platform-admin guard. Pagination/filtering come with the seller
  // lifecycle module; this initial route proves the trust boundary first.
  app.get('/v1/admin/sellers', { preHandler: requirePlatformAdmin }, async () => {
    const result = await db.query('SELECT id, legal_name, slug, state, created_at FROM sellers ORDER BY created_at DESC LIMIT 50');
    return { items: result.rows };
  });
}
