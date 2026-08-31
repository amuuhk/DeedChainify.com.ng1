/*
# Create transfers table for property transfer system

## Overview
Adds a `transfers` table to track property ownership transfers (Deed of Assignment).
Each transfer records seller, buyer, witnesses, barrister, and chief details,
and links to the property being transferred. The transfer goes through a
3-neighbor verification flow before generating a printable deed document.

## New Tables

1. `transfers` — property transfer records.
   - id (uuid, PK)
   - dc_title (text, FK to properties.dc_title) — the property being transferred
   - transfer_id (text, unique) — short ID used in verification URLs / SMS
   - seller_name, seller_phone, seller_nin (text) — seller details
   - buyer_name, buyer_phone, buyer_nin (text) — buyer details
   - sale_price (integer) — transaction price in Naira
   - barrister_name, barrister_phone, barrister_nin (text) — legal representative
   - witness1_phone, witness2_phone, witness3_phone (text) — community witnesses
   - chief_name, chief_phone (text) — traditional authority
   - language (text, default 'en') — deed document language: en | ha | yo
   - status (text, default 'PENDING') — PENDING | APPROVED | DISPUTED
   - witness1_status, witness2_status, witness3_status (text, default 'PENDING')
   - chief_status (text, default 'PENDING')
   - created_by (uuid, FK -> auth.users) — the owner initiating the transfer
   - created_at (timestamptz)

## Security (RLS)
- transfers: owner-scoped CRUD (auth.uid() = created_by). Public SELECT so
  anyone with the transfer_id can verify the transfer (core verification premise).
*/

CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dc_title text REFERENCES properties(dc_title) ON DELETE CASCADE,
  transfer_id text UNIQUE NOT NULL,
  seller_name text NOT NULL,
  seller_phone text NOT NULL,
  seller_nin text,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_nin text,
  sale_price integer NOT NULL DEFAULT 0,
  barrister_name text,
  barrister_phone text,
  barrister_nin text,
  witness1_phone text,
  witness2_phone text,
  witness3_phone text,
  chief_name text,
  chief_phone text,
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'PENDING',
  witness1_status text NOT NULL DEFAULT 'PENDING',
  witness2_status text NOT NULL DEFAULT 'PENDING',
  witness3_status text NOT NULL DEFAULT 'PENDING',
  chief_status text NOT NULL DEFAULT 'PENDING',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can verify a transfer by its transfer_id
DROP POLICY IF EXISTS "public_read_transfers" ON transfers;
CREATE POLICY "public_read_transfers" ON transfers FOR SELECT
  TO anon, authenticated USING (true);

-- Owner-scoped inserts
DROP POLICY IF EXISTS "insert_own_transfers" ON transfers;
CREATE POLICY "insert_own_transfers" ON transfers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

-- Owner-scoped updates
DROP POLICY IF EXISTS "update_own_transfers" ON transfers;
CREATE POLICY "update_own_transfers" ON transfers FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Owner-scoped deletes
DROP POLICY IF EXISTS "delete_own_transfers" ON transfers;
CREATE POLICY "delete_own_transfers" ON transfers FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfers_dc_title ON transfers(dc_title);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_id ON transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_by ON transfers(created_by);
