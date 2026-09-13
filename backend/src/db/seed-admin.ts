import argon2 from 'argon2';
import { z } from 'zod';
import { config } from '../config.js';
import { db, withTransaction } from './client.js';

const input = z.object({
  LOCAL_ADMIN_EMAIL: z.string().email(),
  LOCAL_ADMIN_PASSWORD: z.string().min(16).max(200),
  LOCAL_ADMIN_NAME: z.string().min(2).max(100).default('Local Platform Admin'),
}).parse(process.env);

async function main() {
  if (config.NODE_ENV === 'production') throw new Error('The local admin bootstrap is disabled in production');
  await withTransaction(async (client) => {
    const hash = await argon2.hash(input.LOCAL_ADMIN_PASSWORD, { type: argon2.argon2id });
    const user = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, updated_at = now()
       RETURNING id`, [input.LOCAL_ADMIN_EMAIL.toLowerCase(), hash, input.LOCAL_ADMIN_NAME],
    );
    await client.query(
      `INSERT INTO platform_admins (user_id, role, mfa_required)
       VALUES ($1, 'super_admin', true)
       ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', mfa_required = true`, [user.rows[0].id],
    );
  });
  console.log(`Local platform administrator is ready: ${input.LOCAL_ADMIN_EMAIL}`);
  await db.end();
}

main().catch(async (error) => { console.error(error); await db.end(); process.exit(1); });
