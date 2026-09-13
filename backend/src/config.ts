import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4010),
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3021'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().max(30).default(7),
  COURIER_WEBHOOK_SECRET: z.string().min(32).optional(),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_ACCESS_KEY: z.string().default('nexgo_local'),
  MINIO_SECRET_KEY: z.string().default('nexgo_local_only_change_me'),
  MINIO_BUCKET: z.string().default('nexgo-private'),
  // 32-byte AES-256 key, base64-encoded. Local dev only — production uses
  // per-record envelope encryption via AWS KMS instead of a static key.
  LOCAL_ENCRYPTION_KEY: z.string().min(1),
});

export const config = schema.parse(process.env);
