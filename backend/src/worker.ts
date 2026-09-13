import { db, withTransaction } from './db/client.js';

type Job = { id: string; seller_id: string | null; job_type: string; payload: Record<string, unknown>; attempts: number };

async function claimNextJob(): Promise<Job | null> {
  return withTransaction(async (client) => {
    const result = await client.query<Job>(
      `WITH candidate AS (
         SELECT id FROM job_runs WHERE state = 'queued' ORDER BY queued_at FOR UPDATE SKIP LOCKED LIMIT 1
       )
       UPDATE job_runs j SET state = 'running', attempts = attempts + 1, started_at = now()
       FROM candidate WHERE j.id = candidate.id
       RETURNING j.id, j.seller_id, j.job_type, j.payload, j.attempts`,
    );
    return result.rows[0] ?? null;
  });
}

async function complete(job: Job, result: Record<string, unknown>) {
  await db.query(`UPDATE job_runs SET state = 'succeeded', result = $1, completed_at = now() WHERE id = $2 AND state = 'running'`, [JSON.stringify(result), job.id]);
}

async function fail(job: Job, error: unknown) {
  const summary = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown worker error';
  const state = job.attempts >= 5 ? 'dead_letter' : 'queued';
  await db.query(`UPDATE job_runs SET state = $1::job_state, error_summary = $2, completed_at = CASE WHEN $1 = 'dead_letter' THEN now() ELSE NULL END WHERE id = $3`, [state, summary, job.id]);
}

async function execute(job: Job) {
  switch (job.job_type) {
    case 'channel.sync':
      // The real provider adapter replaces this deterministic local result.
      await complete(job, { provider: 'mock', synced: 0, message: 'Connection registered; provider credentials are required to sync real orders.' });
      return;
    default:
      throw new Error(`No worker handler is registered for ${job.job_type}`);
  }
}

async function tick() {
  const job = await claimNextJob();
  if (!job) return;
  try { await execute(job); } catch (error) { await fail(job, error); }
}

const interval = setInterval(() => { void tick(); }, 1000);
void tick();
console.log('NEXGO worker started');

const shutdown = async () => { clearInterval(interval); await db.end(); process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
