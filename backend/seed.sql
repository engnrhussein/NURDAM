-- NÜRDAM Cleanroom Management System — Seed Data
-- Run: wrangler d1 execute nurdam-db --local --file=./seed.sql

-- Seed equipment
INSERT OR IGNORE INTO Equipment (name, is_active) VALUES ('FR Magnetic Sputtering', 1);
INSERT OR IGNORE INTO Equipment (name, is_active) VALUES ('E-Beam device', 1);
