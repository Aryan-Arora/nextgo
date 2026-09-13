ALTER TABLE job_runs ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX job_runs_claim_lookup ON job_runs (state, next_attempt_at, queued_at);
