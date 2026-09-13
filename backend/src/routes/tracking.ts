import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { db, withSellerTransaction } from '../db/client.js';
import { isProgressionAllowed, mapCourierStatus, validWebhookSignature } from '../lib/courier.js';
import { requireSeller } from './seller.js';

const eventInput = z.object({ eventId: z.string().min(1).max(200), awb: z.string().min(4).max(100), status: z.string().min(2).max(100), occurredAt: z.string().datetime(), location: z.string().max(160).optional(), description: z.string().min(2).max(1000).optional() });

export async function trackingRoutes(app: FastifyInstance) {
  app.get('/v1/shipments/:shipmentId/tracking', { preHandler: requireSeller }, async (request) => {
    const seller = request.principal!; const shipmentId = z.string().uuid().parse((request.params as { shipmentId: string }).shipmentId);
    return withSellerTransaction(seller.sellerId, async (client) => {
      const exists = await client.query('SELECT 1 FROM shipments WHERE id=$1 AND seller_id=$2', [shipmentId, seller.sellerId]);
      if (!exists.rows[0]) throw Object.assign(new Error('Shipment not found'), { statusCode: 404 });
      return { items: (await client.query('SELECT state,occurred_at,location,description,source FROM shipment_events WHERE shipment_id=$1 ORDER BY occurred_at DESC', [shipmentId])).rows };
    });
  });

  app.post('/v1/webhooks/couriers/:providerCode', { config: { rawBody: true } }, async (request, reply) => {
    if (!config.COURIER_WEBHOOK_SECRET) return reply.code(503).send({ error: 'COURIER_WEBHOOKS_NOT_CONFIGURED' });
    if (!request.rawBody) return reply.code(400).send({ error: 'RAW_WEBHOOK_BODY_REQUIRED' });
    const raw = request.rawBody.toString();
    const signature = request.headers['x-nexgo-signature'];
    if (!validWebhookSignature(raw, typeof signature === 'string' ? signature : undefined, config.COURIER_WEBHOOK_SECRET)) return reply.code(401).send({ error: 'INVALID_WEBHOOK_SIGNATURE' });
    const input = eventInput.parse(request.body); const providerCode = z.string().regex(/^[a-z0-9-]{2,64}$/).parse((request.params as { providerCode: string }).providerCode);
    const bodyHash = createHash('sha256').update(raw).digest('hex');
    const delivery = await db.query<{ id: string }>('INSERT INTO webhook_deliveries (provider_code, external_event_id, payload_hash, payload) VALUES ($1,$2,$3,$4) ON CONFLICT (provider_code, external_event_id) DO NOTHING RETURNING id', [providerCode, input.eventId, bodyHash, JSON.stringify(input)]);
    if (!delivery.rows[0]) return { accepted: true, duplicate: true };
    const state = mapCourierStatus(input.status);
    if (!state) { await db.query('UPDATE webhook_deliveries SET processing_error=$1,processed_at=now() WHERE id=$2', ['Unsupported courier status', delivery.rows[0].id]); return reply.code(422).send({ error: 'UNSUPPORTED_COURIER_STATUS' }); }
    const shipment = await db.query<{ id: string; seller_id: string; state: typeof state }>('SELECT s.id,s.seller_id,s.state FROM shipments s JOIN courier_providers cp ON cp.id=s.provider_id WHERE s.awb=$1 AND cp.code=$2', [input.awb, providerCode]);
    if (!shipment.rows[0]) { await db.query('UPDATE webhook_deliveries SET processing_error=$1,processed_at=now() WHERE id=$2', ['Shipment not found', delivery.rows[0].id]); return reply.code(404).send({ error: 'SHIPMENT_NOT_FOUND' }); }
    const current = shipment.rows[0];
    if (!isProgressionAllowed(current.state, state)) { await db.query('UPDATE webhook_deliveries SET processing_error=$1,processed_at=now() WHERE id=$2', [`Invalid transition ${current.state} -> ${state}`, delivery.rows[0].id]); return reply.code(409).send({ error: 'INVALID_SHIPMENT_TRANSITION' }); }
    await db.query('BEGIN');
    try {
      await db.query('INSERT INTO shipment_events (shipment_id,state,occurred_at,location,description,source,source_event_id,raw_payload) VALUES ($1,$2,$3,$4,$5,\'courier_webhook\',$6,$7)', [current.id, state, input.occurredAt, input.location ?? null, input.description ?? input.status, input.eventId, JSON.stringify(input)]);
      await db.query('UPDATE shipments SET state=$1::shipment_state,updated_at=now() WHERE id=$2', [state, current.id]);
      if (state === 'ndr') await db.query(`INSERT INTO ndr_cases (seller_id,shipment_id,reason_code,reason_detail)
        VALUES ($1,$2,$3,$4) ON CONFLICT (shipment_id) DO NOTHING`, [current.seller_id, current.id, 'courier_ndr', input.description ?? input.status]);
      await db.query('UPDATE webhook_deliveries SET processed_at=now() WHERE id=$1', [delivery.rows[0].id]); await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    return { accepted: true, duplicate: false };
  });
}
