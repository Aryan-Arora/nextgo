import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import { config } from './config.js';
import { db } from './db/client.js';
import { authRoutes } from './routes/auth.js';
import { sellerRoutes } from './routes/seller.js';
import { adminRoutes } from './routes/admin.js';

const app = Fastify({ logger: { level: config.NODE_ENV === 'production' ? 'info' : 'debug' }, requestIdHeader: 'x-request-id' });
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cookie);
await app.register(cors, { origin: config.FRONTEND_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'] });

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) return reply.code(400).send({ error: 'VALIDATION_ERROR', details: error.flatten() });
  request.log.error(error);
  return reply.code((error as { statusCode?: number }).statusCode || 500).send({ error: 'INTERNAL_ERROR' });
});

app.get('/health', async () => ({ status: 'ok', service: 'nexgo-api' }));
app.get('/ready', async (_request, reply) => {
  try { await db.query('SELECT 1'); return { status: 'ready' }; }
  catch { return reply.code(503).send({ status: 'not_ready' }); }
});
await app.register(authRoutes);
await app.register(sellerRoutes);
await app.register(adminRoutes);

const close = async () => { await app.close(); await db.end(); };
process.on('SIGTERM', close); process.on('SIGINT', close);
await app.listen({ port: config.PORT, host: '0.0.0.0' });
