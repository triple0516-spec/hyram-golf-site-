-- No directly identifying customer information is stored in this table.
CREATE TABLE IF NOT EXISTS verification_attempts (
 id TEXT PRIMARY KEY NOT NULL,
 state_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 used_at INTEGER
);
CREATE INDEX IF NOT EXISTS ix_hyram_verification_expiry ON verification_attempts(created_at);
