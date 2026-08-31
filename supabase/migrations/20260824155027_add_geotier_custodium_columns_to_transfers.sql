/*
# Add geotier and custodium columns to transfers table

## Overview
Adds columns to the `transfers` table to support the Geotier pricing system
and Private Custodium blockchain sealing. These columns store the tier price,
tier number, state, LGA, and the sealed PDF hash / ledger ID / signature.

## Modified Tables

1. `transfers` — added columns:
   - tier_price (integer) — the geotier fee for this transfer
   - tier (integer) — the tier number (1-5)
   - state (text) — the state for geotier lookup
   - lga (text) — the LGA for geotier lookup
   - pdf_hash (text) — SHA-256 hash of the sealed deed PDF
   - ledger_id (text) — links to private_ledger.id
   - signature (text) — HMAC-SHA256 signature from custodium sealing

## Security
- No policy changes. Existing RLS policies on transfers remain unchanged.
*/

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS tier_price integer;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS tier integer;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS lga text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS pdf_hash text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS ledger_id text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS signature text;
