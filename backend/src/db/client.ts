import { Pool, type PoolClient } from 'pg';
import { config } from '../config.js';

export const db = new Pool({ connectionString: config.DATABASE_URL, max: 12 });

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function withSellerTransaction<T>(sellerId: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
  return withTransaction(async (client) => {
    await client.query("SELECT set_config('app.seller_id', $1, true)", [sellerId]);
    return work(client);
  });
}
