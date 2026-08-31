/*
# Create scan_logs table for lifetime scan tracking

## Overview
Replaces the monthly scan counter with a per-scan log table.
Each scan is recorded as an individual row, allowing "2 free scans for life"
per property instead of resetting monthly.

## New Tables

1. `scan_logs` — individual scan records per property.
   - id (uuid, PK)
   - dc_title (text, NOT NULL) — the property scanned
   - cost (integer, NOT NULL, default 0) — 0 for free scans, 5000 for paid
   - created_at (timestamptz, default now())

## Security (RLS)
- scan_logs: public read + insert (anyone can scan a public QR).
  No update/delete needed — scans are append-only.
*/

CREATE TABLE IF NOT EXISTS scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dc_title text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_scan_logs" ON scan_logs;
CREATE POLICY "public_read_scan_logs" ON scan_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_scan_logs" ON scan_logs;
CREATE POLICY "public_insert_scan_logs" ON scan_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scan_logs_dc_title ON scan_logs(dc_title);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON scan_logs(created_at);
