/*
# Create private_ledger table for Private Custodium blockchain

## Overview
Adds a `private_ledger` table that acts as DeedChainify's internal blockchain.
Each transfer deed is sealed as a block with a SHA-256 hash of the PDF,
an HMAC-SHA256 signature, and a chain link to the previous block's hash.
This makes every deed tamper-proof and government-friendly.

## New Tables

1. `private_ledger` — blockchain-style ledger entries for sealed deeds.
   - id (uuid, PK)
   - transfer_id (text, unique) — links to transfers.transfer_id
   - dc_title (text) — the property being transferred
   - pdf_hash (text, NOT NULL) — SHA-256 hash of the deed PDF
   - previous_hash (text) — hash of the prior block (GENESIS_BLOCK for first)
   - signature (text, NOT NULL) — HMAC-SHA256 of block data using server secret
   - nonce (text, NOT NULL) — unique UUID per block to prevent replay
   - status (text, default 'SEALED') — SEALED | VERIFIED | TAMPERED
   - timestamp (timestamptz, default now())

## Security (RLS)
- private_ledger: public SELECT (anyone can verify a ledger entry by ID).
  INSERT/UPDATE restricted to service role (edge function only) — no
  anon/authenticated write policies, so the frontend cannot forge blocks.
*/

CREATE TABLE IF NOT EXISTS private_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id text UNIQUE,
  dc_title text NOT NULL,
  pdf_hash text NOT NULL,
  previous_hash text,
  signature text NOT NULL,
  nonce text NOT NULL,
  status text NOT NULL DEFAULT 'SEALED',
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private_ledger ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can verify a custodium entry
DROP POLICY IF EXISTS "public_read_private_ledger" ON private_ledger;
CREATE POLICY "public_read_private_ledger" ON private_ledger FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated.
-- Only the service role (used by edge functions) can write to this table.

CREATE INDEX IF NOT EXISTS idx_private_ledger_transfer_id ON private_ledger(transfer_id);
CREATE INDEX IF NOT EXISTS idx_private_ledger_dc_title ON private_ledger(dc_title);
