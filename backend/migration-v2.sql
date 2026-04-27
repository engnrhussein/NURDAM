-- NÜRDAM v2 Migration: Add password_plain, is_blocked, is_boss columns
-- Run: wrangler d1 execute nurdam-db --remote --file=./migration-v2.sql

ALTER TABLE Users ADD COLUMN password_plain TEXT DEFAULT NULL;
ALTER TABLE Users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Users ADD COLUMN is_boss INTEGER NOT NULL DEFAULT 0;

-- Mark the existing admin (dr.ramazan) as the boss
UPDATE Users SET is_boss = 1 WHERE username = 'dr.ramazan';
-- Store the known seed password for dr.ramazan
UPDATE Users SET password_plain = 'admin123' WHERE username = 'dr.ramazan';
