import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db, withSellerTransaction } from '../db/client.js';
import { requireAccountAdmin, requirePlatformAdmin } from '../lib/adminAuth.js';
import { requireSeller } from './seller.js';

function principal(request: FastifyRequest) {
  if (!request.principal) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  return request.principal;
}

const generateInput = z.object({ sellerId: z.string().uuid(), cycleStart: z.string().date(), cycleEnd: z.string().date() });

export async function codRemittanceRoutes(app: FastifyInstance) {
  app.post('/v1/admin/cod-remittances/generate', { preHandler: [requirePlatformAdmin, requireAccountAdmin] }, async (request, reply) => {
    const input = generateInput.parse(request.body);
    if (input.cycleEnd < input.cycleStart) return reply.code(400).send({ error: 'INVALID_CYCLE' });
    const totals = await db.query<{ shipment_count: string; cod_collected: string; charges_deducted: string }>(
      `SELECT count(*)::int AS shipment_count, COALESCE(SUM(o.cod_amount_paise),0)::bigint AS cod_collected,
              COALESCE(SUM(sh.shipping_charge_paise),0)::bigint AS charges_deducted
       FROM shipments sh JOIN orders o ON o.id = sh.order_id
       WHERE sh.seller_id = $1 AND sh.state = 'delivered' AND o.payment_mode = 'cod'
         AND sh.booked_at::date BETWEEN $2 AND $3`,
      [input.sellerId, input.cycleStart, input.cycleEnd],
    );
    const row = totals.rows[0];
    if (Number(row.shipment_count) === 0) return reply.code(422).send({ error: 'NO_COD_SHIPMENTS_IN_CYCLE' });
    const result = await db.query(
      `INSERT INTO cod_remittance_cycles (seller_id, cycle_start, cycle_end, shipment_count, cod_collected_paise, charges_deducted_paise, net_remitted_paise)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.sellerId, input.cycleStart, input.cycleEnd, row.shipment_count, row.cod_collected, row.charges_deducted, BigInt(row.cod_collected) - BigInt(row.charges_deducted)],
    );
    await db.query(
      `INSERT INTO audit_events (seller_id, actor_user_id, action, target_type, target_id, request_id, metadata)
       VALUES ($1,$2,'cod_remittance.generated','cod_remittance_cycle',$3,$4,$5)`,
      [input.sellerId, request.adminPrincipal!.userId, result.rows[0].id, request.id, JSON.stringify({ shipmentCount: row.shipment_count })],
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.post('/v1/admin/cod-remittances/:cycleId/approve', { preHandler: [requirePlatformAdmin, requireAccountAdmin] }, async (request, reply) => {
    const cycleId = z.string().uuid().parse((request.params as { cycleId: string }).cycleId);
    const current = await db.query<{ status: string; seller_id: string }>('SELECT status, seller_id FROM cod_remittance_cycles WHERE id = $1 FOR UPDATE', [cycleId]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'CYCLE_NOT_FOUND' });
    if (current.rows[0].status !== 'pending') return reply.code(409).send({ error: 'CYCLE_NOT_PENDING' });
    const result = await db.query('UPDATE cod_remittance_cycles SET status=\'approved\', approved_by=$1, approved_at=now() WHERE id=$2 RETURNING id, status, approved_at', [request.adminPrincipal!.userId, cycleId]);
    await db.query(
      `INSERT INTO audit_events (seller_id, actor_user_id, action, target_type, target_id, request_id)
       VALUES ($1,$2,'cod_remittance.approved','cod_remittance_cycle',$3,$4)`,
      [current.rows[0].seller_id, request.adminPrincipal!.userId, cycleId, request.id],
    );
    return result.rows[0];
  });

  // Deliberately a separate step from approve, even though both currently
  // accept the same admin roles: this is where "the bank transfer actually
  // happened" gets recorded, and splitting it from approval leaves room to
  // require a second, different approver here later without a schema change.
  app.post('/v1/admin/cod-remittances/:cycleId/remit', { preHandler: [requirePlatformAdmin, requireAccountAdmin] }, async (request, reply) => {
    const cycleId = z.string().uuid().parse((request.params as { cycleId: string }).cycleId);
    const { bankReference } = z.object({ bankReference: z.string().trim().min(3).max(120) }).parse(request.body);
    const current = await db.query<{ status: string; seller_id: string }>('SELECT status, seller_id FROM cod_remittance_cycles WHERE id = $1 FOR UPDATE', [cycleId]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'CYCLE_NOT_FOUND' });
    if (current.rows[0].status !== 'approved') return reply.code(409).send({ error: 'CYCLE_NOT_APPROVED' });
    const result = await db.query(
      'UPDATE cod_remittance_cycles SET status=\'remitted\', bank_reference=$1, remitted_by=$2, remitted_at=now() WHERE id=$3 RETURNING id, status, remitted_at, bank_reference',
      [bankReference, request.adminPrincipal!.userId, cycleId],
    );
    await db.query(
      `INSERT INTO audit_events (seller_id, actor_user_id, action, target_type, target_id, request_id, metadata)
       VALUES ($1,$2,'cod_remittance.remitted','cod_remittance_cycle',$3,$4,$5)`,
      [current.rows[0].seller_id, request.adminPrincipal!.userId, cycleId, request.id, JSON.stringify({ bankReference })],
    );
    return result.rows[0];
  });

  app.get('/v1/admin/cod-remittances', { preHandler: requirePlatformAdmin }, async (request) => {
    const q = z.object({ sellerId: z.string().uuid().optional(), status: z.enum(['pending', 'approved', 'remitted']).optional() }).parse(request.query);
    const result = await db.query(
      `SELECT c.*, s.legal_name AS seller_name FROM cod_remittance_cycles c JOIN sellers s ON s.id = c.seller_id
       WHERE ($1::uuid IS NULL OR c.seller_id = $1) AND ($2::cod_remittance_status IS NULL OR c.status = $2)
       ORDER BY c.created_at DESC LIMIT 100`,
      [q.sellerId ?? null, q.status ?? null],
    );
    return { items: result.rows };
  });

  app.get('/v1/seller/cod-remittances', { preHandler: requireSeller }, async (request) => {
    const p = principal(request);
    return withSellerTransaction(p.sellerId, async (client) => ({
      items: (await client.query('SELECT id, cycle_start, cycle_end, shipment_count, cod_collected_paise, charges_deducted_paise, net_remitted_paise, status, bank_reference, remitted_at FROM cod_remittance_cycles WHERE seller_id=$1 ORDER BY cycle_start DESC LIMIT 100', [p.sellerId])).rows,
    }));
  });
}
