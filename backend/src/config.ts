import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4010),
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3021'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().max(30).default(7),
});

export const config = schema.parse(process.env);
