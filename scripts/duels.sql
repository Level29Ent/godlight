-- Apply once to the existing DATABASE_URL database before enabling Divine Duels.
BEGIN;
CREATE TABLE IF NOT EXISTS divine_duel (
  code text PRIMARY KEY,
  host_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  guest_id text REFERENCES "user"(id) ON DELETE CASCADE,
  host_move text CHECK (host_move IN ('sun', 'rain', 'lightning')),
  guest_move text CHECK (guest_move IN ('sun', 'rain', 'lightning')),
  host_score integer NOT NULL DEFAULT 0,
  guest_score integer NOT NULL DEFAULT 0,
  round integer NOT NULL DEFAULT 0,
  last_result jsonb,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
CREATE INDEX IF NOT EXISTS divine_duel_host_expiry ON divine_duel(host_id, expires_at);
COMMIT;
-- Operational cleanup: DELETE FROM divine_duel WHERE expires_at < now();
