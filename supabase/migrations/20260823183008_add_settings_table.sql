/*
# Add settings table for platform logo

## Overview
Creates a `settings` table to store platform-level configuration like
the uploaded logo URL. Single-row table (key-value style).

## New Tables
1. `settings` — key-value platform config
   - id (uuid PK)
   - key (text, unique) — e.g. 'logo_url'
   - value (text)
   - created_at, updated_at

## Security
- RLS enabled, public read (anon + authenticated) so the logo shows for everyone
- Only authenticated users can insert/update
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_settings" ON settings;
CREATE POLICY "read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_settings" ON settings;
CREATE POLICY "insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_settings" ON settings;
CREATE POLICY "update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
