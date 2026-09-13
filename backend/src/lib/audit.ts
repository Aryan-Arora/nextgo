import type { PoolClient } from 'pg';

export async function audit(client: PoolClient, input: { sellerId?: string; actorUserId?: string; action: string; targetType: string; targetId: string; requestId: string; metadata?: Record<string, unknown> }) {
  await client.query(
    `INSERT INTO audit_events (seller_id, actor_user_id, action, target_type, target_id, request_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.sellerId ?? null, input.actorUserId ?? null, input.action, input.targetType, input.targetId, input.requestId, JSON.stringify(input.metadata ?? {})],
  );
}
